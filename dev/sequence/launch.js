const LaunchSequence = new LogotypeSequence({
	count: 3,
	create: function(value) {
		// if (isFirstLaunch()) {
			BitmapDrawableFactory.mapDirectory(Dirs.ASSET, false);
			LogotypeSequence.prototype.create.apply(this, arguments);
		// }
	},
	getExpirationTime: function() {
		return isFirstLaunch() ? LogotypeSequence.prototype.getExpirationTime.apply(this, arguments) : 0;
	},
	process: function(index) {
		index = LogotypeSequence.prototype.process.apply(this, arguments);
		if (index == 1) {
			updateSettings();
			if (reportError.getDebugValues() === null) {
				reportError.addDebugValue("isHorizon", isHorizon);
				reportError.addDebugValue("interfaceScale", uiScaler);
				reportError.addDebugValue("fontSizeScale", fontScale);
				reportError.addDebugValue("loadSupportables", loadSupportables);
				reportError.addDebugValue("autosaveEnabled", autosave);
				reportError.addDebugValue("moveMapping", saveCoords);
			}
			BitmapDrawableFactory.mapDirectory(Dirs.ASSET, true);
			FileTools.assureDir(Dirs.EXPORT);
		} else if (index == 2) {
			AssetFactory.loadAsset("minecraftFont", "font.ttf");
			typeface = AssetFactory.createFont("minecraft");
			registerAdditionalInformation();
		} else if (index == 3) {
			// let logotype = this.getWindow(),
				// mapped = BitmapDrawableFactory.findMappedByTag("*"),
				// animation = AnimationDrawable.parseJson.call(this, mapped);
			// animation.setDefaultDuration(5);
			// logotype.setIcon(animation);
			// "blockNoTextures": ["blockDefineTexture", "blockDefineWrong"], 1500
			// while (animation.isProcessing()) java.lang.Thread.yield();
			refreshSupportablesIcons();
		}
		return index;
	},
	cancel: function(error) {
		let sequence = this;
		confirm(translate(NAME) + " " + translate(VERSION),
			translate("Launch sequence interrupted or handled exception.") + " " +
			translate("Do you want to retry modification launch?"), function() {
				handle(function() {
					sequence.execute();
				}, sequence.getExpirationTime() * 2);
			});
		if (!isFirstLaunch()) LogotypeSequence.prototype.create.call(this);
		LogotypeSequence.prototype.cancel.apply(this, arguments);
	},
	complete: function(active) {
		LogotypeSequence.prototype.complete.apply(this, arguments);
		if (firstLaunchTutorial && isFirstLaunch()) {
			TutorialSequence.Welcome.execute();
		} else checkValidate(function() {
			ProjectEditor.create();
			if (showHint.launchStacked !== undefined) {
				showHint.unstackLaunch();
			}
			LevelProvider.attach();
			if (Level.isLoaded()) {
				LevelProvider.show();
			}
		});
		loadSetting("user_login.first_launch", "boolean", false);
		__config__.save();
		if (textures.length <= 1) {
			FetchAdditionalSequence.execute();
		}
	}
});

const FetchAdditionalSequence = new SnackSequence({
	requiresProgress: false,
	count: 4,
	process: function(index) {
		if (index == 1) {
			let file = new java.io.File(Dirs.SUPPORT, "ModelConverter/src/index.js");
			if (file.exists() && file.length() > 0) {
				ModelConverter = FileTools.readFileText(file.getPath());
			}
		} else if (index == 2) {
			let path = Dirs.RESOURCE + "textures/terrain_texture.json";
			if (FileTools.exists(path)) {
				let text = FileTools.readFileText(path);
				if (text && text.length > 0) {
					let object = compileData(text, "object");
					if (object) {
						let terrain = object.texture_data;
						if (terrain) {
							let index = addTextureMod(translate("All list"));
							for (let item in terrain) {
								let element = terrain[item];
								if (!element) continue;
								let items = element.textures;
								if (!items) continue
								if (Array.isArray(items)) {
									for (let t = 0; t < items.length; t++) {
										let name = items[t];
										if (typeof name == "object") {
											addTexture(index, name.path, t);
										} else addTexture(index, item, t);
									}
								} else if (items !== undefined && items !== null) {
									if (typeof items == "object") {
										addTexture(index, items.path, 0);
									} else addTexture(index, item, 0);
								}
							}
						}
					}
				}
			}
		} else if (index == 3) {
			let path = Dirs.ASSET + (isHorizon ? "blocks-12" : "blocks-0") + ".json";
			if (FileTools.exists(path)) {
				let data = FileTools.readFileText(path);
				if (data && (data = compileData(data, "object"))) {
					let index = addTextureMod(translate("Minecraft"));
					textures[index].items = data;
				}
			}
		} else if (index == 4) {
			let mods = Files.listDirectories(Dirs.MOD);
			for (let m = 0; m < mods.length; m++) {
				let directory = mods[m].getPath() + "/";
				let redirect = directory + ".redirect";
				if (FileTools.exists(redirect)) {
					directory = FileTools.readFileText(redirect).trim();
				}
				let path = directory + "build.config";
				if (!FileTools.exists(path)) {
					continue;
				}
				tryout(function() {
					let text = FileTools.readFileText(path);
					let config = compileData(text, "object");
					let resources = config && config.resources ? config.resources : null;
					if (!resources || resources.length == 0) {
						return;
					}
					let index = addTextureMod(mods[m].getName());
					for (let i = 0; i < resources.length; i++) {
						let resource = resources[i];
						if (resource && resource.resourceType == "resource") {
							let res = directory + resource.path + "terrain-atlas";
							if (!FileTools.exists(res)) return;
							let files = Files.listFileNames(res, true);
							files = Files.checkFormats(files, [".png", ".tga"]);
							for (let t = 0; t < files.length; t++) {
								let name = files[t];
								if (!name || name.length == 0) {
									return;
								}
								name = Files.getNameWithoutExtension(name);
								let begin = name.indexOf(resource.path);
								if (begin != -1) name = name.substring(begin);
								let animation = name.lastIndexOf(".anim.");
								if (animation != -1) name = name.substring(0, animation);
								let underscore = name.lastIndexOf("_");
								if (underscore != -1) {
									addTexture(index, name.substring(0, underscore), name.substring(underscore + 1));
								} else addTexture(index, name, 0);
							}
						}
					}
				});
			}
		}
		return index;
	},
	getPrecompleteHint: function() {
		return translate("Textures requested successfully");
	}
});
