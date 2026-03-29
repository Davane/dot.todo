import * as vscode from 'vscode';
import { TodoEditorProvider } from './TodoEditorProvider';

export function activate(context: vscode.ExtensionContext) {
  const provider = new TodoEditorProvider(context);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      TodoEditorProvider.viewType,
      provider,
      {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: false,
      }
    )
  );
}

export function deactivate() {}
