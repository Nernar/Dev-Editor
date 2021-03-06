/*

   Copyright 2018-2021 Nernar (github.com/nernar)
   
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
   
       http://www.apache.org/licenses/LICENSE-2.0
   
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

*/

MCSystem.setLoadingTip("Initialization Script");

// Currently build information
const REVISION = "develop-alpha-0.4-09.07.2021-0";
const NAME = __mod__.getInfoProperty("name");
const AUTHOR = __mod__.getInfoProperty("author");
const VERSION = __mod__.getInfoProperty("version");
const DESCRIPTION = __mod__.getInfoProperty("description");
const isInstant = Boolean(this.isInstant);

// Configurable: autosave
let autosave = true;
let autosavePeriod = 45;
let autosaveProjectable = true;

// Configurable: interface
let maxWindows = 8;
let fontScale = uiScaler = 1.0;
let menuDividers = false;
let projectHeaderBackground = false;

// Configurable: messages
let hintStackableDenied = false;
let maximumHints = 25;
let showProcesses = true;
let safetyProcesses = true;

// Configurable: workers
let saveCoords = false;
let drawSelection = true;
let transparentBoxes = true;
let transitionSideDividers = 8;

// Configurable: supportables
let currentEnvironment = __name__;
let isSupportEnv = false;
let supportSupportables = true;
let loadSupportables = true;

// Configurable: explorer
let maximumThumbnailBounds = 96;
let maximumAllowedBounds = 1920;
let importAutoselect = false;

// Different values
let keyExpiresSoon = false;
let ignoreKeyDeprecation = false;
let noImportedScripts = true;

// Runtime changed values
let warningMessage = null;
let Setting, UIEditor, WorldEdit, DumpCreator, RunJSingame, InstantRunner, ModelConverter;

// Definitions for default values
let firstLaunchTutorial = REVISION.startsWith("testing");
let typeface = android.graphics.Typeface.MONOSPACE;

MCSystem.setLoadingTip("Import Libraries");

IMPORT("Retention:4");

const prepareDebugInfo = function() {
	return NAME + " " + VERSION + " by " + AUTHOR + " for " + (isHorizon ? "Horizon" : "Inner Core") +
		" Report Log\nREVISION " + REVISION.toUpperCase() + ", ANDROID " + android.os.Build.VERSION.SDK_INT;
};

let alreadyHasDate = false;
reportError.setStackAction(function(err) {
	let message = reportError.getCode(err) + ": " + reportError.getStack(err),
		file = new java.io.File(Dirs.LOGGING, REVISION + ".log");
	if (file.isDirectory()) {
		Files.deleteRecursive(file.getPath());
	}
	file.getParentFile().mkdirs();
	if (!file.exists()) {
		Files.write(file, prepareDebugInfo());
	}
	if (!alreadyHasDate) {
		Files.addText(file, "\n" + reportError.getLaunchTime());
		alreadyHasDate = true;
	}
	Files.addText(file, "\n" + message);
	showHint(translate("Error stack saved into internal storage"));
});

Interface.getFontSize = function(size) {
	return Math.round(this.getX(size) / this.Display.DENSITY * fontScale);
};

Interface.getX = function(x) {
	return x > 0 ? Math.round(this.Display.WIDTH / (1280 / x) * uiScaler) : x;
};

Interface.getY = function(y) {
	return y > 0 ? Math.round(this.Display.HEIGHT / (720 / y) * uiScaler) : y;
};

IMPORT("Network:2");
IMPORT("Transition:6");
IMPORT("Action:4");

if (REVISION.startsWith("develop")) {
	IMPORT("Stacktrace:1");
}

reportTrace.setupPrint(function(message) {
	message !== undefined && showHint(message);
});

const retraceOrReport = function(error) {
	if (REVISION.startsWith("develop")) {
		reportTrace(error);
	} else reportError(error);
};

IMPORT("Sequence:1");

getPlayerEnt = function() {
	return Number(Player.get());
};
