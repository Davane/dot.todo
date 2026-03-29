import * as vscode from 'vscode';

export interface ResolveResult {
  uri: vscode.Uri | null;
  fileExists: boolean;
}

/**
 * Resolve @path relative to the list file's directory, then the first workspace folder root.
 */
export async function resolveTodoReference(
  todoUri: vscode.Uri,
  refPath: string,
  workspaceFolders: readonly vscode.WorkspaceFolder[] | undefined
): Promise<ResolveResult> {
  const todoDir = vscode.Uri.joinPath(todoUri, '..');

  const tryStat = async (u: vscode.Uri): Promise<boolean> => {
    try {
      await vscode.workspace.fs.stat(u);
      return true;
    } catch {
      return false;
    }
  };

  const relative = vscode.Uri.joinPath(todoDir, refPath);
  if (await tryStat(relative)) {
    return { uri: relative, fileExists: true };
  }

  if (workspaceFolders?.length) {
    const root = workspaceFolders[0].uri;
    const fromRoot = vscode.Uri.joinPath(root, refPath);
    if (await tryStat(fromRoot)) {
      return { uri: fromRoot, fileExists: true };
    }
  }

  return { uri: null, fileExists: false };
}
