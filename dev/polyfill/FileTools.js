let FileTools = this.FileTools || new Object();

injectMethod(FileTools, "utils.FileTools", "assureAndGetCrashDir");
injectMethod(FileTools, "utils.FileTools", "unpackInputStream");
injectMethod(FileTools, "utils.FileTools", "getAssetInputStream");
injectMethod(FileTools, "utils.FileTools", "getAssetBytes");
injectMethod(FileTools, "utils.FileTools", "getAssetAsBitmap");
injectMethod(FileTools, "utils.FileTools", "listAssets");
injectMethod(FileTools, "utils.FileTools", "getAssetAsString");
injectMethod(FileTools, "utils.FileTools", "unpackResource");
injectMethod(FileTools, "utils.FileTools", "unpackAsset");
// injectMethod(FileTools, "utils.FileTools", "unpackAssetDir");
injectMethod(FileTools, "utils.FileTools", "checkdirs");
injectMethod(FileTools, "utils.FileTools", "exists");
injectMethod(FileTools, "utils.FileTools", "mkdirs");
injectMethod(FileTools, "utils.FileTools", "assureDir");
injectMethod(FileTools, "utils.FileTools", "assureFileDir");
injectMethod(FileTools, "utils.FileTools", "getMcTypeface");
injectMethod(FileTools, "utils.FileTools", "readFileText");
injectMethod(FileTools, "utils.FileTools", "writeFileText");
injectMethod(FileTools, "utils.FileTools", "addFileText");
injectMethod(FileTools, "utils.FileTools", "readFileAsBitmap");
injectMethod(FileTools, "utils.FileTools", "writeBitmap");
injectMethod(FileTools, "utils.FileTools", "readJSON");
injectMethod(FileTools, "utils.FileTools", "readJSONArray");
injectMethod(FileTools, "utils.FileTools", "writeJSON");
injectMethod(FileTools, "utils.FileTools", "getPrettyPath");
injectMethod(FileTools, "utils.FileTools", "copy");

if (isHorizon) {
	injectMethod(FileTools, "utils.FileTools", "assetExists");
	injectMethod(FileTools, "utils.FileTools", "getAssetAsJSON");
	injectMethod(FileTools, "utils.FileTools", "getAssetAsJSONArray");
	injectMethod(FileTools, "utils.FileTools", "listDirectory");
	FileTools.remove = requireMethod("utils.FileTools", "delete");
}
