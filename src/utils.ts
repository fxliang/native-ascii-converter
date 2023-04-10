import * as vscode from 'vscode';
const uchars  = require('uchars');

// アクティブテキストファイルの全内容を取得する
export const getFullText = () : string => {
  return getDocument().getText();
};

// アクティブテキストファイルの全内容を置き換える
export const setFullText = (newText : string) : void => {
  
  const document = getDocument();
  const invalidRange = new vscode.Range(0, 0, document.lineCount, 0);
  const fullRange = document.validateRange(invalidRange);

  const editor = getEditor();
  editor.edit(builder => builder.replace(fullRange, newText));

  // 中途半端に選択された状態になるので、選択を解除する
  editor.selection = new vscode.Selection(0, 0, 0, 0);
};

// Unicode形式にエンコードする
export const nativeToAscii = (text : string, lowerCase : boolean = true) : string => {

  return text.split('')
    .map(char => {
      const code = char.charCodeAt(0);

      if (code <= 0x7f) {
        // ASCII文字はそのまま
        return char;
      }

      // 8ビット文字は0パディングする
      const escaped = escape(char).replace('%', code <= 0xff ? '\\u00' : '\\');

      return lowerCase ? escaped.toLocaleLowerCase() : escaped;
    })
    .join('');
};

export const nativeToCodePoint = (text : string, lowerCase : boolean = true) : string => {
    var res  = "";
     var arr  = uchars(text);
     for(var i=0; i < arr.length; i++)
     {
         //console.log(arr[i].codePointAt(0));
         if(arr[i].codePointAt(0) < 0x7f){
             if (i > 0 && arr[i - 1].codePointAt(0) >= 0x7f && arr[i].codePointAt(0) != 0x20 && arr[i].codePointAt(0) != '\t')
                 res += " "
             res += arr[i];
         }
         else{
             var pre = lowerCase ? "\\u" : "\\U";
             var value = (arr[i].codePointAt(0)).toString(16);
             value = lowerCase ? value.toLocaleLowerCase() : value.toLocaleUpperCase();
             res += pre + value;
         }
     }
    return res;
 };
// Unicode形式からデコードする
export const asciiToNative = (text : string) : string => {
  return unescape(text.replace(/\\(?=u[0-9A-Za-z])/g, '%'));
};

export const codePointToNative = (text : string) : string => {
    var newText = text;
    // matchAll by steps;
    var mats = [];
    var mat;
    var regex = /\\u[a-f0-9A-F]+/gi;
    while (mat = regex.exec(newText)) {
        mats.push(mat);
    }
    // matchAll end, get mats
    if (mats.length) {
        for (var i = 0; i < mats.length; i++) {
            newText = newText.replace(mats[i][0], String.fromCodePoint(parseInt(mats[i][0].substring(2), 16)));
        }
    }
    return newText;
};
// アクティブテキストエディターを取得する
export const getEditor = () : vscode.TextEditor => {
  if (vscode.window.activeTextEditor) {
    return vscode.window.activeTextEditor;
  }

  throw new Error('Text editor is not active.');
};

// アクティブテキストエディターのドキュメントを取得する
export const getDocument = () : vscode.TextDocument => {
  const editor = getEditor();
  if (editor.document) {
    return editor.document;
  }

  throw new Error('Text document is not active.');
};

// アクティブドキュメントの改行文字を取得する
export const getEol = () : string => {
  return getDocument().eol === vscode.EndOfLine.LF ? '\n' : '\r\n';
};

// アクティブドキュメントがpropertiesファイルか
export const isActiveDocumentPropertiesFile = () : boolean => {
  const useFilesAssociations = getConfigParameter('use-files.associations');
  const document = getDocument();

  if (useFilesAssociations) {
    return document.languageId === 'properties';
  } else {
    return document.fileName.endsWith('.properties');
  }
};

// 設定パラメータを取得する
export const getConfigParameter = (name : string) : any => {
  const config = vscode.workspace.getConfiguration('native-ascii-converter');
  return config.get(name);
};
