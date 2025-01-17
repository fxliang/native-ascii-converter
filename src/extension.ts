import * as vscode from 'vscode';
import * as utils from './utils';

const DISPLAY_NAME = 'Native-ASCII Converter';

const COMMENT_PREFIX = '#';

export function activate(context: vscode.ExtensionContext) {

  // テキストエディターを開いてるときときに実行可能なコマンドを登録

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'extension.convertNativeToAscii', handle(convertNativeToAscii))
  );

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'extension.convertAsciiToNative', handle(convertAsciiToNative))
  );

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'extension.convertCodePointToNative', handle(convertCodePointToNative))
  );
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      'extension.convertNativeToCodePoint', handle(convertNativeToCodePoint))
  );
  registerListeners();
}

export function deactivate() {}

// アクティブドキュメントの内容をUnicodeエンコード変換する
const convertNativeToAscii = () : void => {
  const lowerCase = utils.getConfigParameter('letter-case') === 'Lower case';
  const commentConversion = utils.getConfigParameter('comment-conversion');

  const newText = utils.getFullText()
    .split(/\r?\n/g)
    .map(line => {
      if (!commentConversion && line.startsWith(COMMENT_PREFIX)) {
        return line;
      } else {
        return utils.nativeToAscii(line, lowerCase);
      }
    })
    .join(utils.getEol());

  utils.setFullText(newText);
};

const convertNativeToCodePoint = () : void => {
  const lowerCase = utils.getConfigParameter('letter-case') === 'Lower case';
  const commentConversion = utils.getConfigParameter('comment-conversion');

  const newText = utils.getFullText()
    .split(/\r?\n/g)
    .map(line => {
      if (!commentConversion && line.startsWith(COMMENT_PREFIX)) {
        return line;
      } else {
        return utils.nativeToCodePoint(line, lowerCase);
      }
    })
    .join(utils.getEol());

  utils.setFullText(newText);
};
// アクティブドキュメントの内容をUnicodeデコード変換する
const convertAsciiToNative = () : void => {
  const newText = utils.asciiToNative(utils.getFullText());
  utils.setFullText(newText);
};

const convertCodePointToNative = () : void => {
  const newText = utils.codePointToNative(utils.getFullText());
  utils.setFullText(newText);
};
// 変換処理関数をラップして、エラーハンドリングを行う
const handle = (func : Function) => {
  return () => {
    try {
      func();
    } catch (e) {
      console.error(DISPLAY_NAME, e);
      if (e.message) {
        vscode.window.showErrorMessage(`[${DISPLAY_NAME}] ${e.message}`);
      }
    }
  };
};

// テキストファイルイベントのリスナー登録
const registerListeners = () : void => {

  // 保存時の自動変換
  vscode.workspace.onWillSaveTextDocument(event => {
    if (utils.getConfigParameter('auto-conversion-on-save')
        && utils.isActiveDocumentPropertiesFile()) {
      handle(convertNativeToAscii)();
    }
  });

  // アクティブ時の自動変換
  vscode.window.onDidChangeActiveTextEditor(textEditor => {

    if (vscode.window.activeTextEditor
        && utils.getConfigParameter('auto-conversion-on-activate')
        && utils.isActiveDocumentPropertiesFile()) {
      handle(convertAsciiToNative)();
    }
  });
};
