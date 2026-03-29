import * as vscode from 'vscode';
import { parseTodoDocument } from './parser/parseTodoDocument';
import type { TodoDocumentModel } from './parser/types';
import { getWebviewHtml } from './webview/getWebviewHtml';
import { resolveTodoReference } from './utils/resolveTodoReference';
import { updateCheckboxLine } from './utils/updateCheckboxLine';

export class TodoEditorProvider implements vscode.CustomTextEditorProvider {
  public static readonly viewType = 'dot-todo.todoEditor';

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'src', 'webview', 'media'),
      ],
    };
    webviewPanel.webview.html = getWebviewHtml(
      webviewPanel.webview,
      this.context.extensionUri
    );

    const pushModel = async () => {
      const model = await this.buildModel(document);
      webviewPanel.webview.postMessage({ type: 'updateModel', payload: model });
    };

    const changeSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() !== document.uri.toString()) {
        return;
      }
      schedulePush();
    });

    const debounceMs = 80;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedulePush = () => {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        timer = undefined;
        void pushModel();
      }, debounceMs);
    };

    webviewPanel.onDidDispose(() => {
      changeSub.dispose();
      if (timer) {
        clearTimeout(timer);
      }
    });

    webviewPanel.webview.onDidReceiveMessage(async (msg) => {
      switch (msg.type) {
        case 'ready':
          await pushModel();
          break;
        case 'toggleCheckbox': {
          const line = Number(msg.line);
          if (!Number.isInteger(line) || line < 0) {
            break;
          }
          await this.applyCheckboxToggle(document, line);
          await pushModel();
          break;
        }
        case 'openFile': {
          const uriStr = msg.resolvedUri as string | undefined;
          const rawPath = msg.rawPath as string | undefined;
          if (uriStr) {
            try {
              await vscode.commands.executeCommand(
                'vscode.open',
                vscode.Uri.parse(uriStr)
              );
            } catch {
              vscode.window.showWarningMessage(`Could not open: ${uriStr}`);
            }
          } else {
            vscode.window.showWarningMessage(
              `File not found: ${rawPath ?? '(unknown)'}`
            );
          }
          break;
        }
        default:
          break;
      }
    });
  }

  private async buildModel(
    document: vscode.TextDocument
  ): Promise<TodoDocumentModel> {
    const text = document.getText();
    const todoUri = document.uri;
    const folders = vscode.workspace.workspaceFolders;

    return parseTodoDocument(text, document.version, {
      resolveFileRef: async (rawPath: string) => {
        const r = await resolveTodoReference(todoUri, rawPath, folders);
        return {
          resolvedUri: r.uri?.toString(),
          fileExists: r.fileExists,
        };
      },
    });
  }

  private async applyCheckboxToggle(
    document: vscode.TextDocument,
    line: number
  ): Promise<void> {
    if (line >= document.lineCount) {
      return;
    }
    const textLine = document.lineAt(line);
    const newLine = updateCheckboxLine(textLine.text);
    if (newLine === null || newLine === textLine.text) {
      return;
    }
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, textLine.range, newLine);
    await vscode.workspace.applyEdit(edit);
  }
}
