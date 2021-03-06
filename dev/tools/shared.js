/**
 * Attaches information messages to control menus.
 * Requires [[prepareAdditionalInformation]] call
 * to provide control sizes and limit count.
 * @param {MenuWindow} control menu to attach
 * @returns {boolean} can be attached more
 */
const attachAdditionalInformation = function(control) {
	let session = attachAdditionalInformation.session;
	if (session === undefined) throw null;
	return session.hasMore() && session.attachNext(control);
};

const attachWarningInformation = function(control) {
	if (keyExpiresSoon) {
		control.addMessage("menuNetworkKey", translate("Key needs validation and will be expires soon. Please, check network connection, or you have risk to lost testing abilities."));
	} else if (warningMessage !== null) {
		control.addMessage("menuNetwork", translate(warningMessage), function(message) {
			control.removeElement(message), warningMessage = null;
		});
	}
};

const prepareAdditionalInformation = function(count, limit) {
	attachAdditionalInformation.session = new AdditionalMessageFactory.Session(count, limit);
};

const finishAttachAdditionalInformation = function() {
	let session = attachAdditionalInformation.session;
	if (session === undefined) return false;
	session.complete();
	delete attachAdditionalInformation.session;
	return true;
};

const registerAdditionalInformation = function() {
	if (AdditionalMessageFactory.getRegisteredCount() > 0) AdditionalMessageFactory.resetAll();
	AdditionalMessageFactory.register("blockDefineType", translate("Modification still in development state, so something may not work properly."), 0.2);
	AdditionalMessageFactory.register("block", translate("Create custom variations, renders, shapes and collisions in-game with block editor."), 0.2);
	AdditionalMessageFactory.register("entity", translate("Add or load self render, visualize it and create custom intellect pathes in-game with entity editor."), 0);
	AdditionalMessageFactory.register("animation", translate("Transform custom shapes, visualize your own render and just draw it in-game with animation editor."), 0);
	AdditionalMessageFactory.register("transition", translate("Record wonderful video or make quest-modded map in-game with transition editor."), 0.2);
	AdditionalMessageFactory.register("world", translate("Manipulate with world regions, fill, replace and save your buildings with world editor."), 0.2);
	AdditionalMessageFactory.register("explorerExtensionProject", translate("Load or create your first editor, it'll appear here."), 0.75, function() {
		return ProjectProvider.getCount() == 0;
	});
	AdditionalMessageFactory.register("explorerExtensionScript", translate("Use scripts from your mods to import, simply find them in internal exporer."), 0.5, function() {
		return noImportedScripts;
	});
	AdditionalMessageFactory.registerClickable("menuBoard", translate("Have any suggestions to improve environment? Tell about it on our board in Trello!"), 0.2, function(message) {
		let intent = new android.content.Intent(android.content.Intent.ACTION_VIEW,
			android.net.Uri.parse("https://trello.com/b/wzYtpA3W/dev-editor"));
		context.startActivity(intent);
	});
	AdditionalMessageFactory.registerClickable("menuNetworkUser", translate("Want to follow modification updates? Checkout out VK community and starts to be part of it!"), 0.15, function(message) {
		let intent = new android.content.Intent(android.content.Intent.ACTION_VIEW,
			android.net.Uri.parse("https://vk.com/club168765348"));
		context.startActivity(intent);
	});
	AdditionalMessageFactory.registerClickable("menuNetworkSupport", translate("Enjoying development process? Let's discuss, donate and write any suggestions to our messages."), 0.1, function(message) {
		let intent = new android.content.Intent(android.content.Intent.ACTION_VIEW,
			android.net.Uri.parse("https://vk.com/donut/club168765348"));
		context.startActivity(intent);
	});
	AdditionalMessageFactory.registerClickable("menuNetworkConnect", translate("We're in search of developers for project. You may contribute and reshare our open source code."), 0.1, function(message) {
		let intent = new android.content.Intent(android.content.Intent.ACTION_VIEW,
			android.net.Uri.parse("https://github.com/nernar/dev-editor"));
		context.startActivity(intent);
	});
	AdditionalMessageFactory.registerClickable("animationItem", translate("Do you want to see new abilities before it released? Join reopened testing team right now!"), 0.5, function(message) {
		let intent = new android.content.Intent(android.content.Intent.ACTION_VIEW,
			android.net.Uri.parse("https://vk.me/join/mEYEiYxL7SsZcI_S6iJhg4wfU_gTgwlyTx4="));
		context.startActivity(intent);
	});
	AdditionalMessageFactory.registerClickable("menuBoardConfig", translate("Too much messages on screen? You may deny hint sequences and view only recents."), 0.25, function(message) {
		hintStackableDenied = !loadSetting("performance.hint_stackable", "boolean", false);
		showHint(translate("Option successfully changed"));
		let control = message.getWindow();
		control.removeElement(message);
		__config__.save();
	}, function() {
		return !hintStackableDenied;
	});
	AdditionalMessageFactory.registerClickable("menuBoardConfig", translate("Don't want to lost any information from messages? Try allow hints sequences."), 0.25, function(message) {
		hintStackableDenied = !loadSetting("performance.hint_stackable", "boolean", true);
		showHint(translate("Option successfully changed"));
		let control = message.getWindow();
		control.removeElement(message);
		__config__.save();
	}, function() {
		return hintStackableDenied;
	});
	AdditionalMessageFactory.registerClickable("explorerSelectionWhole", translate("Have troubles with interface scales? Try to reset it with default sizes."), 0.5, function(message) {
		uiScaler = loadSetting("interface.interface_scale", "number", 1.0, 1.0);
		fontScale = loadSetting("interface.font_scale", "number", 1.0, 1.0);
		showHint(translate("Option successfully changed"));
		let control = message.getWindow();
		control.removeElement(message);
		__config__.save();
	}, function() {
		return uiScaler != 1.0 || fontScale != 1.0;
	});
	if (supportSupportables) {
		AdditionalMessageFactory.registerClickable("support", translate("Want more? Enable supportables to resolve another developer modifications experience!"), 0.5, function(message) {
			loadSupportables = loadSetting("supportable.enabled", "boolean", true);
			showHint(translate("Supportables will be enabled with next launch"));
			let control = message.getWindow();
			control.removeElement(message);
			__config__.save();
		}, function() {
			return !loadSupportables;
		});
	}
};

/**
 * Used to import, load, replace or merge project
 * provider data. User may select any availabled
 * data or [[action]] willn't launched.
 * @param {Array} result selectable data
 * @param {function} action to do with data
 * @param {string} type project required type
 * @param {boolean} single is requires single selection
 */
const selectProjectData = function(result, action, type, single) {
	tryout(function() {
		if (!result || result.length == 0) return;
		let items = new Array(),
			data = new Array(),
			selected = new Array();
		result.forEach(function(element, index) {
			if (element && (type === undefined || element.type == type)) {
				switch (element.type) {
					case "block":
						let renderers = element.renderer.length + element.collision.length;
						items.push(translate("Block: %s", element.define.id) + "\n" +
							translateCounter(renderers, "no models", "%s1 model",
								"%s" + (renderers % 10) + " models", "%s models", [renderers]));
						break;
					case "entity":
						let models = element.visual.length;
						items.push(translate("Entity: %s", element.define.id) + "\n" +
							translateCounter(models, "no models /\ tree", "%s1 model /\ tree",
								"%s" + (models % 10) + " models \/ tree", "%s models \/ tree", [models]));
						break;
					case "transition":
						let animates = element.animation.length;
						items.push(translate("Transition: %s", (element.define.fps || 60) + " fps") + "\n" +
							translateCounter(animates, "no animates", "%s1 animate",
								"%s" + (animates % 10) + " animates", "%s animates", [animates]));
						break;
				}
				(!single) && selected.push(importAutoselect);
				data.push(element);
			}
		});
		if (items.length == 0) {
			showHint(translate("There's doesn't has any availabled data"));
			return;
		}
		if (items.length == 1) {
			action && action(single ? data[0] : data);
			return;
		}
		select(translate("Element selector"), items, function(selected, items) {
			let value = new Array();
			selected.forEach(function(element, index) {
				element && value.push(data[index]);
			});
			action && action(value);
		}, !single, selected);
	});
};

const showSupportableInfo = function(mod) {
	return tryout(function() {
		let builder = new android.app.AlertDialog.Builder(context,
			android.R.style.Theme_DeviceDefault_Dialog);
		builder.setTitle(translate(mod.modName) + " " + translate(mod.version));
		builder.setMessage((mod.description && mod.description.length > 0 ? translate(mod.description) + "\n" : new String()) +
			translate("Developer: %s", translate(mod.author || "Unknown")) + "\n" + translate("State: %s", translate(mod.result === true ?
				"ACTIVE" : mod.result === false ? "OUTDATED" : mod.result.lineNumber !== undefined ? "FAILED" : !mod.result ? "DISABLED" : "UNKNOWN")));
		builder.setNegativeButton(translate("Remove"), function() {
			confirm(translate("Warning!"), translate("Supportable will be uninstalled with all content inside, please notice that's you're data may be deleted.") + " " +
				translate("Do you want to continue?"),
				function() {
					if (mod.result === true) {
						showHint(translate("Restart game for better stability"));
					}
					eval(mod.modName.replace(/\W/, new String()) + " = null;");
					ExecuteableSupport.uninstall(mod.modName);
					ProjectEditor.menu();
				});
		});
		builder.setPositiveButton(translate("OK"), null);
		builder.create().show();
		return true;
	}, false);
};

const confirm = function(title, message, action, button) {
	handle(function() {
		let builder = new android.app.AlertDialog.Builder(context,
			android.R.style.Theme_DeviceDefault_Dialog);
		if (title !== undefined) builder.setTitle(title || translate("Confirmation"));
		if (message !== undefined) builder.setMessage(String(message));
		builder.setNegativeButton(translate("Cancel"), null);
		builder.setPositiveButton(button || translate("Yes"), action ? function() {
			tryout(action);
		} : null);
		builder.setCancelable(false);
		builder.create().show();
	});
};

const select = function(title, items, action, multiple, approved) {
	handle(function() {
		if (!Array.isArray(items)) MCSystem.throwException("Nothing to select inside select()");
		let builder = new android.app.AlertDialog.Builder(context,
			android.R.style.Theme_DeviceDefault_Dialog);
		if (title !== undefined) builder.setTitle(title || translate("Selection"));
		builder.setNegativeButton(translate("Cancel"), null);
		if (multiple) {
			if (approved === undefined) approved = new Array();
			builder.setMultiChoiceItems(items, approved, function(dialog, index, active) {
				tryout(function() {
					approved[index] = Boolean(active);
				});
			});
			builder.setNeutralButton(translate("All"), action ? function() {
				tryout(function() {
					for (let i = 0; i < approved.length; i++) {
						approved[i] = true;
					}
					action && action(approved, items);
				});
			} : null);
			builder.setPositiveButton(translate("Select"), action ? function() {
				tryout(function() {
					if (approved.indexOf(true) == -1) {
						select(title, items, action, multiple, approved);
					} else action && action(approved, items);
				});
			} : null);
		} else {
			builder.setItems(items, function(dialog, index) {
				tryout(function() {
					action && action(index, items[index]);
				});
			})
		}
		builder.setCancelable(false);
		builder.create().show();
	});
};

const selectFile = function(availabled, action, outside, directory) {
	handle(function() {
		let explorer = new ExplorerWindow();
		availabled && explorer.setFilter(availabled);
		let bar = explorer.addPath().setPath(directory || Dirs.EXPORT);
		bar.setOnOutsideListener(function(bar) {
			if (outside !== undefined) {
				outside && outside() !== false && explorer.hide();
			} else explorer.dismiss();
		});
		explorer.setOnSelectListener(function(popup, file) {
			explorer.dismiss();
			action && action(file);
		});
		explorer.show();
	});
};

const saveFile = function(name, availabled, action, outside, directory) {
	handle(function() {
		let explorer = new ExplorerWindow();
		availabled && explorer.setFilter(availabled);
		let bar = explorer.addPath().setPath(directory || Dirs.EXPORT);
		bar.setOnOutsideListener(function(bar) {
			if (outside !== undefined) {
				outside && outside() !== false && explorer.hide();
			} else explorer.dismiss();
		});
		let rename = explorer.addRename();
		availabled && rename.setAvailabledTypes(availabled);
		name && rename.setCurrentName(name);
		rename.setOnApproveListener(function(widget, file, last) {
			let approve = function() {
				explorer.dismiss();
				action && action(file, last);
			};
			if (file.exists()) {
				confirm(translate("File is exists"), translate("File is already created, that process will be rewrite it. Continue?"), function() {
					approve();
				});
			} else approve();
		});
		explorer.show();
	});
};

const Tool = function(object) {
	this.reset();
	if (typeof object == "object") {
		object && merge(this, object);
	}
};

Tool.prototype.reset = function() {
	let descriptor = new Object();
	descriptor.buttonBackground = "popupButton";
	descriptor.logotypeProgress = function(tool, control) {
		return calloutOrParse(this, this.logotype, arguments);
	};
	descriptor.logotypeOutside = function(tool, control) {
		let drawable = calloutOrParse(this, this.logotypeProgress, arguments);
		return {
			bitmap: drawable,
			tint: Interface.Color.LTGRAY
		};
	};
	descriptor.logotype = function(tool, control) {
		return requireLogotype();
	};
	descriptor.buttonClick = function(tool, control) {
		if (typeof tool.onControlClick == "function") {
			let args = Array.prototype.slice.call(arguments, 1);
			tool.onControlClick.apply(tool, args);
		}
	};
	descriptor.buttonHold = function(tool, control) {
		tool.collapse();
		return true;
	};
	descriptor.collapsedClick = function(tool, control) {
		tool.control();
	};
	descriptor.hideable = false;
	this.controlDescriptor = descriptor;
};

Tool.prototype.getState = function() {
	return this.state;
};

Tool.prototype.getControlWindow = function() {
	return this.controlWindow || null;
};

Tool.prototype.getControlDescriptor = function() {
	return this.controlDescriptor || null;
};

Tool.prototype.describeControl = function() {
	let control = this.getControlWindow();
	if (control === null) MCSystem.throwException(null);
	ControlWindow.parseJson.call(this, control, this.getControlDescriptor());
};

Tool.prototype.describe = function() {
	this.describeControl();
};

Tool.prototype.attach = function() {
	if (this.isAttached()) {
		MCSystem.throwException("You're must deattach tool firstly!");
	}
	this.controlWindow = new ControlWindow();
	this.state = Tool.State.ATTACHED;
	this.describe();
};

Tool.prototype.isAttached = function() {
	return this.state != Tool.State.INACTIVE;
};

Tool.prototype.deattach = function() {
	let control = this.getControlWindow();
	if (control === null) MCSystem.throwException(null);
	this.state = Tool.State.INACTIVE;
	control.dismiss();
	delete this.controlWindow;
};

Tool.prototype.hide = function() {
	let control = this.getControlWindow();
	if (control === null) return;
	this.state = Tool.State.ATTACHED;
	control.hide();
};

Tool.prototype.isVisible = function() {
	return this.isAttached() && this.state != Tool.State.ATTACHED;
};

Tool.prototype.control = function() {
	let control = this.getControlWindow();
	if (control === null) return;
	this.state = Tool.State.FACED;
	control.transformButton();
	control.show();
};

Tool.prototype.isFaced = function() {
	return this.state == Tool.State.FACED;
};

Tool.prototype.collapse = function() {
	let control = this.getControlWindow();
	if (control === null) return;
	this.state = Tool.State.COLLAPSED;
	control.transformCollapsedButton();
	control.show();
};

Tool.prototype.isCollapsed = function() {
	return this.state == Tool.State.COLLAPSED;
};

Tool.prototype.queue = function(sequence) {
	let control = this.getControlWindow();
	if (control === null) return;
	this.state = Tool.State.QUEUED;
	control.transformLogotype();
	if (sequence instanceof Sequence) {
		let instance = this;
		handleThread(function() {
			sequence.assureYield();
			handle(function() {
				instance.unqueue();
			});
		});
	}
	control.show();
};

Tool.prototype.isQueued = function() {
	return this.state == Tool.State.QUEUED;
};

Tool.prototype.unqueue = function() {
	this.control();
};

Tool.State = new Object();
Tool.State.INACTIVE = 0;
Tool.State.ATTACHED = 1;
Tool.State.FACED = 2;
Tool.State.COLLAPSED = 3;
Tool.State.QUEUED = 4;

Tool.prototype.state = Tool.State.INACTIVE;

const ControlTool = function(object) {
	Tool.apply(this, arguments);
};

ControlTool.prototype = new Tool;

ControlTool.prototype.reset = function() {
	Tool.prototype.reset.apply(this, arguments);
	let descriptor = new Object();
	descriptor.background = "popupControl";
	descriptor.click = function(tool, menu) {
		if (typeof tool.onMenuClick == "function") {
			let args = Array.prototype.slice.call(arguments, 1);
			tool.onMenuClick.apply(tool, args);
		}
	};
	descriptor.closeable = false;
	this.menuDescriptor = descriptor;
};

ControlTool.prototype.getMenuWindow = function() {
	return this.menuWindow || null;
};

ControlTool.prototype.getMenuDescriptor = function() {
	return this.menuDescriptor || null;
};

ControlTool.prototype.describeMenu = function() {
	let menu = this.getMenuWindow();
	if (menu === null) MCSystem.throwException(null);
	MenuWindow.parseJson.call(this, menu, this.getMenuDescriptor());
};

ControlTool.prototype.describe = function() {
	Tool.prototype.describe.apply(this, arguments);
	this.describeMenu();
};

ControlTool.prototype.attach = function() {
	if (this.isAttached()) {
		Tool.prototype.attach.apply(this, arguments);
	}
	this.menuWindow = new MenuWindow();
	Tool.prototype.attach.apply(this, arguments);
};

ControlTool.prototype.deattach = function() {
	let menu = this.getMenuWindow();
	if (menu === null) MCSystem.throwException(null);
	Tool.prototype.deattach.apply(this, arguments);
	menu.dismiss();
	delete this.menuWindow;
};

ControlTool.prototype.hide = function() {
	let menu = this.getMenuWindow();
	if (menu === null) return;
	Tool.prototype.hide.apply(this, arguments);
	menu.hide();
};

ControlTool.prototype.menu = function() {
	let menu = this.getMenuWindow();
	if (menu === null) return;
	let control = this.getControlWindow();
	if (control === null) return;
	this.state = ControlTool.State.CONTROLLING;
	control.hide();
	menu.show();
};

ControlTool.prototype.isControlling = function() {
	return this.state == ControlTool.State.CONTROLLING;
};

ControlTool.prototype.onControlClick = function(control) {
	this.menu();
};

ControlTool.prototype.onMenuClick = function(menu) {
	this.control();
};

ControlTool.prototype.control = function() {
	let menu = this.getMenuWindow();
	if (menu === null) return;
	menu.hide();
	Tool.prototype.control.apply(this, arguments);
};

ControlTool.prototype.collapse = function() {
	let menu = this.getMenuWindow();
	if (menu === null) return;
	menu.hide();
	Tool.prototype.collapse.apply(this, arguments);
};

ControlTool.prototype.queue = function(sequence) {
	let menu = this.getMenuWindow();
	if (menu === null) return;
	menu.hide();
	Tool.prototype.queue.apply(this, arguments);
};

ControlTool.State = clone(Tool.State);
ControlTool.State.CONTROLLING = 5;

const SidebarTool = function(object) {
	ControlTool.apply(this, arguments);
};

SidebarTool.prototype = new ControlTool;

SidebarTool.prototype.reset = function() {
	ControlTool.prototype.reset.apply(this, arguments);
	let descriptor = new Object();
	descriptor.background = "popup";
	if (!menuDividers) descriptor.tabBackground = "popup";
	descriptor.selectGroup = function(tool, sidebar) {
		if (typeof tool.onSelectGroup == "function") {
			let args = Array.prototype.slice.call(arguments, 1);
			tool.onSelectGroup.apply(tool, args);
		}
	};
	descriptor.undockGroup = function(tool, sidebar) {
		if (typeof tool.onUndockGroup == "function") {
			let args = Array.prototype.slice.call(arguments, 1);
			tool.onUndockGroup.apply(tool, args);
		}
		if (tool.isCollapsedWithoutSidebar()) {
			tool.collapse();
		}
	};
	descriptor.fetchGroup = function(tool, sidebar) {
		if (typeof tool.onFetchGroup == "function") {
			let args = Array.prototype.slice.call(arguments, 1);
			return tool.onFetchGroup.apply(tool, args);
		}
	};
	descriptor.selectItem = function(tool, sidebar) {
		if (typeof tool.onSelectItem == "function") {
			let args = Array.prototype.slice.call(arguments, 1);
			tool.onSelectItem.apply(tool, args);
		}
	};
	descriptor.fetchItem = function(tool, sidebar) {
		if (typeof tool.onFetchItem == "function") {
			let args = Array.prototype.slice.call(arguments, 1);
			return tool.onFetchItem.apply(tool, args);
		}
	};
	this.sidebarDescriptor = descriptor;
};

SidebarTool.prototype.getSidebarWindow = function() {
	return this.sidebarWindow || null;
};

SidebarTool.prototype.getSidebarDescriptor = function() {
	return this.sidebarDescriptor || null;
};

SidebarTool.prototype.describeSidebar = function() {
	let sidebar = this.getSidebarWindow();
	if (sidebar === null) MCSystem.throwException(null);
	SidebarWindow.parseJson.call(this, sidebar, this.getSidebarDescriptor());
	if (sidebar.isSelected()) sidebar.reinflateLayout();
};

SidebarTool.prototype.describe = function() {
	ControlTool.prototype.describe.apply(this, arguments);
	this.describeSidebar();
};

SidebarTool.prototype.getSelectedGroup = function() {
	let sidebar = this.getSidebarWindow();
	if (sidebar === null) return SidebarWindow.NOTHING_SELECTED;
	return sidebar.getSelected();
};

SidebarTool.prototype.attach = function() {
	if (this.isAttached()) {
		ControlTool.prototype.attach.apply(this, arguments);
	}
	this.sidebarWindow = new SidebarWindow();
	ControlTool.prototype.attach.apply(this, arguments);
};

SidebarTool.prototype.deattach = function() {
	let sidebar = this.getSidebarWindow();
	if (sidebar === null) MCSystem.throwException(null);
	ControlTool.prototype.deattach.apply(this, arguments);
	sidebar.dismiss();
	delete this.sidebarWindow;
};

SidebarTool.prototype.hide = function() {
	let sidebar = this.getSidebarWindow();
	if (sidebar === null) return;
	ControlTool.prototype.hide.apply(this, arguments);
	sidebar.hide();
};

SidebarTool.prototype.menu = function() {
	let sidebar = this.getSidebarWindow();
	if (sidebar === null) return;
	sidebar.hide();
	ControlTool.prototype.menu.apply(this, arguments);
};

SidebarTool.prototype.control = function() {
	let sidebar = this.getSidebarWindow();
	if (sidebar === null) return;
	sidebar.show();
	ControlTool.prototype.control.apply(this, arguments);
};

SidebarTool.prototype.collapse = function() {
	let sidebar = this.getSidebarWindow();
	if (sidebar === null) return;
	if (!sidebar.isSelected()) {
		sidebar.hide();
	}
	ControlTool.prototype.collapse.apply(this, arguments);
	if (sidebar.isSelected()) {
		this.state = SidebarTool.State.COLLAPSED_WITHOUT_SIDEBAR;
	}
};

SidebarTool.prototype.isCollapsedWithoutSidebar = function() {
	return this.state == SidebarTool.State.COLLAPSED_WITHOUT_SIDEBAR;
};

SidebarTool.prototype.queue = function(sequence) {
	let sidebar = this.getSidebarWindow();
	if (sidebar === null) return;
	sidebar.hide();
	ControlTool.prototype.queue.apply(this, arguments);
};

SidebarTool.State = clone(ControlTool.State);
SidebarTool.State.COLLAPSED_WITHOUT_SIDEBAR = 6;
