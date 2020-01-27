function backupDrive () {
//参考　http://www.googleappsscript.info/2018-02-12/google_drive_move_oldfiles.html
//2019.10.7　作成
//2020.01.24 更新
//　新規データのバックアップを1日1回取る
  //スクリプトプロパティからシートのIDを取得
  var Properties = PropertiesService.getScriptProperties();
  var orgfolder_id = Properties.getProperty("orgfolder_id");
  var backupfolder_id = Properties.getProperty("backupfolder_id");

  //時刻比較を辞める 2020.01.24
  //var now = new Date();
  //var yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);//前日の0時

  // main.
  var org_folder = DriveApp.getFolderById(orgfolder_id);
  var backup_folder = DriveApp.getFolderById(backupfolder_id);
  var folders = org_folder.getFolders();
  var backupfolders = backup_folder.getFolders();

  // 直下のバックアップの必要なファイルは別途取る、原則直下に新規ファイルの追加はしない
  // Backupfolder
  var i = 0;
  var bkfolders=[];
  var bkfolderNames=[];
  while (backupfolders.hasNext()) {
    bkfolders[i] = backupfolders.next();//バックアップフォルダのメンバーフォルダ y01234
    bkfolderNames[i]=bkfolders[i].getName();
    i++;
  }
  Logger.log(bkfolderNames);
  
  //folder
  while (folders.hasNext()) {
    var folder = folders.next();//メンバーフォルダ y01234
    var folderName = folder.getName();
    for(var i=0;i<bkfolders.length;i++){
      if(bkfolderNames[i] === folderName){
        var orgFolderNames=[];//オリジナルフォルダ名配列
        var bkFolderNames=[];//バックアップフォルダ名配列
        orgFolderNames = folderNameGet(folder);//メンバーフォルダ直下のフォルダ名　y01234/ここ
        bkFolderNames = folderNameGet(bkfolders[i]);//バックアップメンバーフォルダ直下のフォルダ名 y01234/ここ
        Logger.log('オリジナルフォルダ名 %s バック名 %s',orgFolderNames,bkFolderNames);
        var diffArr = getArrayDiff(orgFolderNames, bkFolderNames);//新旧の比較のように、配列Aと配列Bを比べ配列Aから変化しているものを返す
        Logger.log('外　%s',diffArr);
        subBackup(folder,diffArr,bkfolders[i]);//該当フォルダを再帰的にバックアップドライブにコピー
      }
    }
  }

}
function test(){
  var oldArr= [1, 2, 3, 4, 5];
  var newArr= [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  var diffArr = getArrayDiff( newArr,oldArr);
  Logger.log(diffArr);

}
 /*
 * コピーするフォルダを選定
 * @param {Object} folder　オリジナルメンバーフォルダ
 * @param {Arry} diffarr 差のあるフォルダ名
 * @param {Object} bkfolder バックアップメンバーフォルダ
 *
 */
function subBackup(folder,diffArr,bkfolder){
  var folders = folder.getFolders(); //target folder群 
  while(folders.hasNext()) {
    var subFolder = folders.next();
    var folderName = subFolder.getName();
    for(var i=0;i<diffArr.length;i++){
      if(folderName === diffArr[i]){
      var copyFolder = bkfolder.createFolder(folderName);
        folderCopy(subFolder,copyFolder);
      }
    }
      
  }
}
 /*
 * 新旧の比較のように、配列Aと配列Bを比べ配列Aから変化しているものを返す
 * https://chaika.hatenablog.com/entry/2017/04/26/084500
 * @param {Array} オリジナルフォルダ内フォルダ名配列　A
 * @param {Array} バックアップフォルダ内フォルダ名配列 B
 * return {Array} 差分配列 変化している要素名
 *
 */
function getArrayDiff(arr1, arr2){
  var arr = arr1.concat(arr2);
  var result =  arr.filter(function( value ){
    return !(arr1.indexOf(value) !== -1 && arr2.indexOf(value) !== -1);    
  });
  return result;
}

 /*
 * フォルダ名を取得
 * @param {Object} folder オリジナルメンバーフォルダ
 * return {Array} orgFolderNames フォルダ名配列
 *
 */
 function folderNameGet(folder){
  var folders = folder.getFolders(); //target folder群 
  var orgFolderNames = [];//フォルダ内フォルダ名
  while(folders.hasNext()) {
    var subFolder = folders.next();
    var folderName = subFolder.getName();
    orgFolderNames.push(folderName);      
  }
  return orgFolderNames; 
 }

 /*
 * フォルダを再帰的にコピー作成　
 * @param {Object} folder　オリジナルメンバーフォルダ
 * return {Object} bkfolder バックアップメンバーフォルダ
 *
 */
function folderCopy(folder,bkfolder) {
//再帰的にできるんだな、、、受け取った段階ではcopyFolderは空っぽ
  var folders = folder.getFolders(); //target folder群
  var files = folder.getFiles();

  while(files.hasNext()) {
    var file = files.next();
      Logger.log(file.getName() + ": this file copy");
      file.makeCopy(file.getName(),bkfolder);
  }
  while(folders.hasNext()) {
    var subFolder = folders.next();
    var folderName = subFolder.getName();
    var copyFolder = bkfolder.createFolder(folderName);
    Logger.log(folder.getName() + ": this folder copy");
    folderCopy(subFolder,copyFolder);
  }

}
