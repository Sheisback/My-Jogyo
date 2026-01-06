import type { Plugin } from "@opencode-ai/plugin";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { homedir } from "os";
import { fileURLToPath } from "url";

import manifest from "./gyoshu-manifest.json";
import { GyoshuPlugin as GyoshuHooks } from "./plugin/gyoshu-hooks";

const OPENCODE_CONFIG = path.join(homedir(), ".config", "opencode");
const GYOSHU_STATE_DIR = path.join(OPENCODE_CONFIG, ".gyoshu");
const INSTALL_STATE_FILE = path.join(GYOSHU_STATE_DIR, "install.json");

const ALLOWED_CATEGORIES = new Set([
  "agent",
  "command",
  "tool",
  "skill",
  "lib",
  "bridge",
  "plugin",
]);

interface InstallState {
  version: string;
  installedAt: string;
  files: string[];
}

function getPackageRoot(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return path.dirname(path.dirname(currentFile));
}

function isValidPath(category: string, file: string): boolean {
  if (!ALLOWED_CATEGORIES.has(category)) return false;
  if (file.includes("..") || path.isAbsolute(file)) return false;
  if (file.includes("\0")) return false;
  return true;
}

function containsSymlink(targetPath: string): boolean {
  const parts = targetPath.split(path.sep);
  let current = parts[0] === "" ? path.sep : parts[0];

  for (let i = 1; i < parts.length; i++) {
    current = path.join(current, parts[i]);
    try {
      const stat = fs.lstatSync(current);
      if (stat.isSymbolicLink()) {
        return true;
      }
    } catch {
      break;
    }
  }
  return false;
}

function validateDestinationPath(destPath: string): { valid: boolean; error?: string } {
  const resolved = path.resolve(destPath);
  const configResolved = path.resolve(OPENCODE_CONFIG);

  if (!resolved.startsWith(configResolved + path.sep)) {
    return { valid: false, error: "Path escapes config directory" };
  }

  if (containsSymlink(resolved)) {
    return { valid: false, error: "Symlink detected in path" };
  }

  return { valid: true };
}

function loadInstallState(): { state: InstallState | null; error?: string } {
  try {
    if (fs.existsSync(INSTALL_STATE_FILE)) {
      const content = fs.readFileSync(INSTALL_STATE_FILE, "utf-8");
      return { state: JSON.parse(content) };
    }
    return { state: null };
  } catch (err) {
    return {
      state: null,
      error: `Failed to load install state: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function saveInstallState(state: InstallState): { success: boolean; error?: string } {
  const tempPath = path.join(GYOSHU_STATE_DIR, `.install.json.tmp.${crypto.randomUUID()}`);

  try {
    fs.mkdirSync(GYOSHU_STATE_DIR, { recursive: true });
    const data = JSON.stringify(state, null, 2);
    fs.writeFileSync(tempPath, data, { mode: 0o644 });
    fs.renameSync(tempPath, INSTALL_STATE_FILE);
    return { success: true };
  } catch (err) {
    try {
      fs.unlinkSync(tempPath);
    } catch {}
    return {
      success: false,
      error: `Failed to save install state: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

function isGyoshuOwned(filePath: string, state: InstallState | null): boolean {
  if (!state) return false;
  return state.files.includes(filePath);
}

function atomicCopyFile(srcPath: string, destPath: string): void {
  const tempPath = `${destPath}.tmp.${crypto.randomUUID()}`;
  try {
    fs.copyFileSync(srcPath, tempPath);
    fs.renameSync(tempPath, destPath);
  } catch (err) {
    try {
      fs.unlinkSync(tempPath);
    } catch {}
    throw err;
  }
}

function installFile(
  packageRoot: string,
  category: string,
  file: string,
  state: InstallState | null
): { installed: boolean; skipped: boolean; updated: boolean; error?: string } {
  if (!isValidPath(category, file)) {
    return { installed: false, skipped: false, updated: false, error: "Invalid path" };
  }

  const srcPath = path.join(packageRoot, "src", category, file);
  const destPath = path.join(OPENCODE_CONFIG, category, file);

  const validation = validateDestinationPath(destPath);
  if (!validation.valid) {
    return { installed: false, skipped: false, updated: false, error: validation.error };
  }

  const relativePath = `${category}/${file}`;
  const fileExists = fs.existsSync(destPath);

  if (fileExists) {
    if (isGyoshuOwned(relativePath, state)) {
      try {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        atomicCopyFile(srcPath, destPath);
        return { installed: false, skipped: false, updated: true };
      } catch (err) {
        return {
          installed: false,
          skipped: false,
          updated: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }
    return { installed: false, skipped: true, updated: false };
  }

  try {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath, fs.constants.COPYFILE_EXCL);
    return { installed: true, skipped: false, updated: false };
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === "EEXIST") {
      return { installed: false, skipped: true, updated: false };
    }
    return {
      installed: false,
      skipped: false,
      updated: false,
      error: error.message,
    };
  }
}

function installSkill(
  packageRoot: string,
  skillName: string,
  state: InstallState | null
): { installed: boolean; skipped: boolean; updated: boolean; error?: string } {
  if (!isValidPath("skill", skillName)) {
    return { installed: false, skipped: false, updated: false, error: "Invalid skill name" };
  }

  const srcDir = path.join(packageRoot, "src", "skill", skillName);
  const destDir = path.join(OPENCODE_CONFIG, "skill", skillName);

  const validation = validateDestinationPath(destDir);
  if (!validation.valid) {
    return { installed: false, skipped: false, updated: false, error: validation.error };
  }

  const relativePath = `skill/${skillName}`;
  const dirExists = fs.existsSync(destDir);

  if (dirExists) {
    if (isGyoshuOwned(relativePath, state)) {
      const tempDir = `${destDir}.tmp.${crypto.randomUUID()}`;
      try {
        fs.cpSync(srcDir, tempDir, { recursive: true });
        const backupDir = `${destDir}.backup.${crypto.randomUUID()}`;
        fs.renameSync(destDir, backupDir);
        try {
          fs.renameSync(tempDir, destDir);
          fs.rmSync(backupDir, { recursive: true, force: true });
        } catch (renameErr) {
          fs.renameSync(backupDir, destDir);
          throw renameErr;
        }
        return { installed: false, skipped: false, updated: true };
      } catch (err) {
        try {
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch {}
        return {
          installed: false,
          skipped: false,
          updated: false,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    }
    return { installed: false, skipped: true, updated: false };
  }

  try {
    fs.cpSync(srcDir, destDir, { recursive: true, errorOnExist: true });
    return { installed: true, skipped: false, updated: false };
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === "EEXIST") {
      return { installed: false, skipped: true, updated: false };
    }
    return {
      installed: false,
      skipped: false,
      updated: false,
      error: error.message,
    };
  }
}

function autoInstall(): {
  installed: number;
  skipped: number;
  updated: number;
  errors: string[];
  installedFiles: string[];
} {
  const packageRoot = getPackageRoot();
  const { state: existingState, error: stateError } = loadInstallState();
  const result = {
    installed: 0,
    skipped: 0,
    updated: 0,
    errors: [] as string[],
    installedFiles: [] as string[],
  };

  if (stateError) {
    result.errors.push(stateError);
  }

  fs.mkdirSync(OPENCODE_CONFIG, { recursive: true });

  for (const [category, files] of Object.entries(manifest.files)) {
    if (category === "skill") {
      for (const skillName of files as string[]) {
        const { installed, skipped, updated, error } = installSkill(
          packageRoot,
          skillName,
          existingState
        );
        const relativePath = `skill/${skillName}`;
        if (installed || updated) result.installedFiles.push(relativePath);
        if (installed) result.installed++;
        if (skipped) result.skipped++;
        if (updated) result.updated++;
        if (error) result.errors.push(`${relativePath}: ${error}`);
      }
    } else {
      for (const file of files as string[]) {
        const { installed, skipped, updated, error } = installFile(
          packageRoot,
          category,
          file,
          existingState
        );
        const relativePath = `${category}/${file}`;
        if (installed || updated) result.installedFiles.push(relativePath);
        if (installed) result.installed++;
        if (skipped) result.skipped++;
        if (updated) result.updated++;
        if (error) result.errors.push(`${relativePath}: ${error}`);
      }
    }
  }

  if (result.installed > 0 || result.updated > 0) {
    const allFiles = existingState?.files || [];
    const newFiles = new Set([...allFiles, ...result.installedFiles]);
    const { error: saveError } = saveInstallState({
      version: manifest.version,
      installedAt: new Date().toISOString(),
      files: Array.from(newFiles),
    });
    if (saveError) {
      result.errors.push(saveError);
    }
  }

  return result;
}

export const GyoshuPlugin: Plugin = async (ctx) => {
  const installResult = autoInstall();

  if (installResult.installed > 0) {
    console.log(
      `🎓 Gyoshu: Installed ${installResult.installed} files to ~/.config/opencode/`
    );
  }

  if (installResult.updated > 0) {
    console.log(`🎓 Gyoshu: Updated ${installResult.updated} files`);
  }

  if (installResult.errors.length > 0) {
    console.warn(`⚠️  Gyoshu: Some issues occurred:`);
    for (const error of installResult.errors) {
      console.warn(`   - ${error}`);
    }
  }

  return GyoshuHooks(ctx);
};

export default GyoshuPlugin;
