const ExplorerWindow = function(mayWrap) {
	let window = UniqueWindow.apply(this, arguments);
	window.setGravity(Interface.Gravity.CENTER);
	window.setWidth(mayWrap ? Interface.Display.WRAP : Interface.Display.MATCH);
	window.setHeight(mayWrap ? Interface.Display.WRAP : Interface.Display.MATCH);
	window.setFocusable(true);
	window.file = new java.io.File(__dir__);
	window.resetContent();
	window.setRootDirectory();
	window.resetAdapter();
	window.setBackground("popupControl");
	window.elements = new Array();
	return window;
};

ExplorerWindow.prototype = new UniqueWindow;
ExplorerWindow.prototype.TYPE = "ExplorerWindow";

ExplorerWindow.prototype.multiple = false;
ExplorerWindow.prototype.single = false;

ExplorerWindow.prototype.resetContent = function() {
	let scope = this,
		views = this.views = new Object();
	let content = new android.widget.FrameLayout(context);
	this.setContent(content);

	views.layout = new android.widget.RelativeLayout(context);
	let params = android.widget.FrameLayout.LayoutParams(Interface.Display.MATCH, Interface.Display.MATCH);
	content.addView(views.layout, params);

	views.files = new android.widget.ListView(context);
	views.files.setOnItemClickListener(function(parent, view, position, id) {
		scope.selectItem(position) && scope.checkIfCanBeApproved();
	});
	views.files.setOnItemLongClickListener(function(parent, view, position, id) {
		scope.isMultipleSelectable() && scope.setMode(Interface.Choice.MULTIPLE);
		scope.selectItem(position) && scope.checkIfCanBeApproved();
		return true;
	});
	params = android.widget.RelativeLayout.LayoutParams(Interface.Display.MATCH, Interface.Display.MATCH);
	views.layout.addView(views.files, params);
	
	views.empty = new android.widget.LinearLayout(context);
	views.empty.setOrientation(Interface.Orientate.VERTICAL);
	views.empty.setGravity(Interface.Gravity.CENTER);
	views.empty.setId(android.R.id.empty);
	params = android.widget.RelativeLayout.LayoutParams(Interface.Display.MATCH, Interface.Display.MATCH);
	views.layout.addView(views.empty, params);
	
	views.icon = new android.widget.ImageView(context);
	new BitmapDrawable("explorerFolder").attachAsImage(views.icon);
	params = android.widget.LinearLayout.LayoutParams(Interface.getY(180), Interface.getY(180));
	views.empty.addView(views.icon, params);
	
	views.info = new android.widget.TextView(context);
	typeface && views.info.setTypeface(typeface);
	views.info.setText(translate("Void itself."));
	views.info.setGravity(Interface.Gravity.CENTER);
	views.info.setTextSize(Interface.getFontSize(36));
	views.info.setTextColor(Interface.Color.WHITE);
	views.info.setPadding(Interface.getY(20), Interface.getY(20), Interface.getY(20), Interface.getY(20));
	views.empty.addView(views.info);
};

ExplorerWindow.prototype.getBackground = function() {
	return this.background || null;
};

ExplorerWindow.prototype.setBackground = function(src) {
	let content = this.getContainer();
	if (!(src instanceof Drawable)) {
		src = Drawable.parseJson.call(this, src);
	}
	src.attachAsBackground(content);
	this.background = src;
	return this;
};

ExplorerWindow.prototype.addElement = function(element) {
	this.indexOfElement(element) == -1 &&
		this.getElements().push(element);
	return element;
};

ExplorerWindow.prototype.getElementAt = function(index) {
	return this.getElements()[index] || null;
};

ExplorerWindow.prototype.getElements = function(index) {
	return this.elements;
};

ExplorerWindow.prototype.getElementCount = function(index) {
	return this.getElements().length;
};

ExplorerWindow.prototype.indexOfElement = function(item) {
	return this.getElements().indexOf(item);
};

ExplorerWindow.prototype.removeElement = function(elementOrIndex) {
	let index = typeof elementOrIndex == "object" ?
		this.indexOfElement(elementOrIndex) : elementOrIndex;
	let element = this.getElementAt(index);
	if (!element) return this;
	let content = element.getContent();
	if (!content) return this;
	let set = new ActorSet(),
		fade = new FadeActor(),
		bounds = new BoundsActor();
	bounds.setInterpolator(new AccelerateInterpolator());
	bounds.setDuration(400);
	set.addActor(bounds);
	fade.setDuration(200);
	set.addActor(fade);
	this.beginDelayedActor(set);
	this.views.layout.removeView(content);
	this.getElements().splice(index, 1);
	return this;
};

ExplorerWindow.prototype.setPath = function(path) {
	this.file = new java.io.File(path);
	let dirs = Files.listDirectoryNames(path);
	let files = Files.listFileNames(path);
	if (this.filter && this.filter.length >= 0) {
		files = Files.checkFormats(files, this.filter);
	}
	this.setItems(dirs.concat(files));
	this.__explore && this.__explore(this.file);
};

ExplorerWindow.prototype.setFilter = function(filter) {
	if (!Array.isArray(filter)) filter = [filter];
	this.filter = filter.slice();
};

ExplorerWindow.prototype.getDirectory = function() {
	return this.file;
};

ExplorerWindow.prototype.setRootDirectory = function(path) {
	this.external = String(path || Dirs.EXTERNAL);
	(!this.external.endsWith("/")) && (this.external += "/");
};

ExplorerWindow.prototype.getRootDirectory = function() {
	return this.external;
};

ExplorerWindow.prototype.setItems = function(array) {
	this.adapter.setRoot(this.file.getPath());
	this.adapter.setItems(array);
	let fade = new FadeActor();
	fade.setDuration(400);
	this.beginDelayedActor(fade);
	if (array.length == 0) {
		this.views.files.setVisibility(Interface.Visibility.GONE);
		this.views.empty.setVisibility(Interface.Visibility.VISIBLE);
	} else {
		this.views.files.setVisibility(Interface.Visibility.VISIBLE);
		this.views.empty.setVisibility(Interface.Visibility.GONE);
	}
};

ExplorerWindow.prototype.setMode = function(mode) {
	this.adapter && this.adapter.setMode(mode);
};

ExplorerWindow.prototype.setUnselectMode = function(mode) {
	this.adapter && this.adapter.setUnselectMode(mode);
};

ExplorerWindow.prototype.selectItem = function(index) {
	if (this.adapter.choice != Interface.Choice.MULTIPLE && this.adapter.isDirectory(index) == true) {
		let file = this.adapter.getFile(index);
		this.setPath(file.getPath());
		return false;
	}
	this.adapter.selectItem(index);
	return true;
};

ExplorerWindow.prototype.isMultipleSelectable = function() {
	return this.multiple;
};

ExplorerWindow.prototype.setMultipleSelectable = function(enabled, require) {
	this.multiple = Boolean(enabled);
	require && this.setMode(Interface.Choice.MULTIPLE);
};

ExplorerWindow.prototype.getDefaultMode = function() {
	return this.single ? Interface.Choice.SINGLE : Interface.Choice.NONE;
};

ExplorerWindow.prototype.setApprovedSingle = function(enabled) {
	this.single = Boolean(enabled);
	this.setUnselectMode(this.getDefaultMode());
};

ExplorerWindow.prototype.resetAdapter = function() {
	this.adapter = new ExplorerAdapter();
	this.views.files.setAdapter(this.adapter.self);
};

ExplorerWindow.prototype.getAdapter = function() {
	return this.adapter;
};

ExplorerWindow.prototype.getApproved = function() {
	return this.adapter.getApprovedFiles();
};

ExplorerWindow.prototype.isCanBeApproved = function() {
	return this.adapter.isCanBeApproved() == true;
};

ExplorerWindow.prototype.checkIfCanBeApproved = function() {
	this.__approve && this.__approve(this.getApproved());
};

ExplorerWindow.prototype.setOnApproveListener = function(listener) {
	let scope = this;
	this.__approve = function(files) {
		tryout(function() {
			listener && listener(scope, files);
		});
	};
	return this;
};

ExplorerWindow.prototype.setOnExploreListener = function(listener) {
	let scope = this;
	this.__explore = function(file) {
		tryout(function() {
			listener && listener(scope, file);
		});
	};
	return this;
};

ExplorerWindow.prototype.setOnSelectListener = function(listener) {
	let scope = this,
		adapter = this.getAdapter();
	adapter.setOnSelectListener(function(item, previous) {
		tryout(function() {
			let file = adapter.getFile(item);
			listener && listener(scope, file, item, previous);
		});
	});
};

ExplorerWindow.prototype.setOnUnselectListener = function(listener) {
	let scope = this,
		adapter = this.getAdapter();
	adapter.setOnUnselectListener(function(item) {
		tryout(function() {
			let file = adapter.getFile(item);
			listener && listener(scope, file, item);
		});
	});
};

ExplorerWindow.Approve = function(parentOrSrc, srcOrAction, action) {
	this.reset();
	if (parentOrSrc instanceof ExplorerWindow) {
		this.setWindow(parentOrSrc);
		srcOrAction && this.setIcon(srcOrAction);
		action && this.setOnApproveListener(action);
	} else {
		parentOrSrc && this.setIcon(parentOrSrc);
		srcOrAction && this.setOnApproveListener(srcOrAction);
	}
	this.checkIfCanBeApproved();
	this.setBackground("popupButton");
};

ExplorerWindow.Approve.prototype.reset = function() {
	let scope = this,
		views = this.views = new Object();
	let content = new android.widget.ImageView(context);
	content.setVisibility(Interface.Visibility.GONE);
	content.setPadding(Interface.getY(20), Interface.getY(20), Interface.getY(20), Interface.getY(20));
	content.setScaleType(Interface.Scale.CENTER_CROP);
	content.setOnClickListener(function() {
		scope.approve();
	});
	this.content = content;
};

ExplorerWindow.Approve.prototype.getContent = function() {
	return this.content || null;
};

ExplorerWindow.Approve.prototype.getWindow = function() {
	return this.window || null;
};

ExplorerWindow.Approve.prototype.setWindow = function(window) {
	if (!window || typeof window != "object") return this;
	window.elements && window.elements.indexOf(this) == -1
		&& window.elements.push(this);
	let layout = window.views ? window.views.layout : null,
		content = this.getContent(),
		scope = this;
	if (!layout || !content) return this;
	let actor = new BoundsActor();
	actor.setDuration(600);
	window.beginDelayedActor(actor);
	let params = new android.widget.RelativeLayout.LayoutParams(Interface.getY(120), Interface.getY(120));
	params.setMargins(Interface.getY(40), Interface.getY(40), Interface.getY(40), Interface.getY(40));
	params.addRule(android.widget.RelativeLayout.ALIGN_PARENT_BOTTOM);
	params.addRule(android.widget.RelativeLayout.ALIGN_PARENT_RIGHT);
	layout.addView(content, params);
	window.setOnApproveListener(function() {
		scope.checkIfCanBeApproved();
	});
	this.window = window;
	return this;
};

ExplorerWindow.Approve.prototype.getBackground = function() {
	return this.background || null;
};

ExplorerWindow.Approve.prototype.setBackground = function(src) {
	let content = this.getContent();
	if (!(src instanceof Drawable)) {
		src = Drawable.parseJson.call(this, src);
	}
	src.attachAsBackground(content);
	this.background = src;
	return this;
};

ExplorerWindow.Approve.prototype.getIcon = function() {
	return this.icon || null;
};

ExplorerWindow.Approve.prototype.setIcon = function(src) {
	let content = this.getContent();
	if (!(src instanceof Drawable)) {
		src = Drawable.parseJson.call(this, src);
	}
	src.attachAsImage(content);
	this.icon = src;
	return this;
};

ExplorerWindow.Approve.prototype.approve = function() {
	let window = this.getWindow();
	this.__approve && this.__approve(this, window ? window.getApproved() : null);
	return this;
};

ExplorerWindow.Approve.prototype.checkIfCanBeApproved = function() {
	let content = this.getContent(),
		window = this.getWindow();
	if (window) {
		let actor = new FadeActor();
		actor.setDuration(400);
		window.beginDelayedActor(actor);
	}
	content.setVisibility(window && window.isCanBeApproved() ?
		Interface.Visibility.VISIBLE : Interface.Visibility.GONE);
	content.setEnabled(window && window.isCanBeApproved());
};

ExplorerWindow.Approve.prototype.setOnApproveListener = function(listener) {
	this.__approve = function(approve, files) {
		tryout(function() {
			listener && listener(approve, files);
		});
	};
	return this;
};

ExplorerWindow.prototype.addApprove = function(srcOrApprove, actionOrSrc, action) {
	let approve = srcOrApprove instanceof ExplorerWindow.Approve ?
		srcOrApprove : new ExplorerWindow.Approve(this, srcOrApprove, actionOrSrc);
	actionOrSrc && srcOrApprove instanceof ExplorerWindow.Approve &&
		srcOrApprove.setIcon(actionOrSrc);
	action && srcOrApprove instanceof ExplorerWindow.Approve &&
		srcOrApprove.setOnApproveListener(action);
	this.indexOfElement(approve) == -1 && this.getElements().push(approve);
	return approve;
};

ExplorerWindow.Path = function(parentOrAction, action) {
	this.reset();
	if (parentOrAction instanceof ExplorerWindow) {
		this.setWindow(parentOrAction);
		action && this.setOnExploreListener(action);
	} else parentOrAction && this.setOnExploreListener(parentOrAction);
	this.setBackground("popup");
	this.pathes = new Array();
};

ExplorerWindow.Path.prototype.reset = function() {
	let scope = this,
		views = this.views = new Object();
	let content = new android.widget.LinearLayout(context);
	content.setId(java.lang.String("pathLayout").hashCode());
	content.setOrientation(Interface.Orientate.VERTICAL);
	content.setGravity(Interface.Gravity.BOTTOM);
	content.setOnClickListener(function() {
		scope.__outside && scope.__outside(scope);
	});
	let params = new android.widget.RelativeLayout.LayoutParams(Interface.Display.MATCH, Interface.getY(110));
	this.content = (content.setLayoutParams(params), content);

	views.scroll = new android.widget.HorizontalScrollView(context);
	params = android.widget.LinearLayout.LayoutParams(Interface.Display.MATCH, Interface.Display.WRAP);
	content.addView(views.scroll, params);

	views.layout = new android.widget.LinearLayout(context);
	views.layout.setPadding(Interface.getY(10), 0, Interface.getY(10), 0);
	params = android.view.ViewGroup.LayoutParams(Interface.Display.MATCH, Interface.Display.WRAP);
	views.scroll.addView(views.layout, params);
};

ExplorerWindow.Path.prototype.getContent = function() {
	return this.content || null;
};

ExplorerWindow.Path.prototype.getWindow = function() {
	return this.window || null;
};

ExplorerWindow.Path.prototype.setWindow = function(window) {
	if (!window || typeof window != "object") return this;
	window.elements && window.elements.indexOf(this) == -1
		&& window.elements.push(this);
	let layout = window.views ? window.views.layout : null,
		content = this.getContent(),
		files = window.views ? window.views.files : null,
		scope = this;
	if (!layout || !content || !files) return this;
	let actor = new BoundsActor();
	actor.setDuration(600);
	window.beginDelayedActor(actor);
	let params = files.getLayoutParams();
	params.addRule(android.widget.RelativeLayout.BELOW, content.getId());
	layout.addView(content, 0);
	window.setOnExploreListener(function(window, file) {
		scope.__explore && scope.__explore(file);
		scope.updatePath();
	});
	this.window = window;
	return this;
};

ExplorerWindow.Path.prototype.getBackground = function() {
	return this.background || null;
};

ExplorerWindow.Path.prototype.setBackground = function(src) {
	let content = this.getContent();
	if (!(src instanceof Drawable)) {
		src = Drawable.parseJson.call(this, src);
	}
	src.attachAsBackground(content);
	this.background = src;
	return this;
};

ExplorerWindow.Path.prototype.addPathElement = function(view, extendsArrow) {
	if (!view) return;
	extendsArrow = extendsArrow === undefined ?
		Boolean(this.lastPath) : extendsArrow;
	this.lastPath = view;
	extendsArrow && this.attachArrowToPath();
	this.pathes.push(this.views.layout.addView(view));
};

ExplorerWindow.Path.prototype.makePathClick = function(path) {
	let scope = this;
	return function() {
		let file = new java.io.File(path);
		file.exists() && scope.setPath(file.getPath());
	};
};

ExplorerWindow.Path.prototype.addPathIcon = function(src, file) {
	let path = new android.widget.ImageView(context);
	new BitmapDrawable(src).attachAsImage(path);
	path.setPadding(Interface.getY(10), Interface.getY(10), Interface.getY(10), Interface.getY(10));
	path.setScaleType(Interface.Scale.CENTER_CROP);
	path.setOnClickListener(this.makePathClick(file));
	let params = android.widget.LinearLayout.LayoutParams(Interface.getY(60), Interface.getY(60));
	return (path.setLayoutParams(params), this.addPathElement(path));
};

ExplorerWindow.Path.prototype.addPathText = function(text, file) {
	let path = new android.widget.TextView(context);
	text !== undefined && path.setText(text);
	typeface && path.setTypeface(typeface);
	path.setTextColor(Interface.Color.WHITE);
	path.setGravity(Interface.Gravity.CENTER);
	path.setTextSize(Interface.getFontSize(21));
	path.setPadding(Interface.getY(10), Interface.getY(10), Interface.getY(10), Interface.getY(10));
	path.setOnClickListener(this.makePathClick(file));
	let params = android.widget.LinearLayout.LayoutParams(Interface.Display.WRAP, Interface.Display.MATCH);
	return (path.setLayoutParams(params), this.addPathElement(path));
};

ExplorerWindow.Path.prototype.attachArrowToPath = function() {
	let path = new android.widget.ImageView(context);
	new BitmapDrawable("controlAdapterDivider").attachAsImage(path);
	path.setPadding(Interface.getY(10), Interface.getY(20), Interface.getY(10), Interface.getY(20));
	path.setScaleType(Interface.Scale.CENTER_CROP);
	let params = android.widget.LinearLayout.LayoutParams(Interface.getY(30), Interface.getY(60));
	return (path.setLayoutParams(params), this.addPathElement(path, false));
};

ExplorerWindow.Path.prototype.setPath = function(path) {
	let window = this.getWindow();
	window && window.setPath(path);
	return this;
};

ExplorerWindow.Path.prototype.updatePath = function() {
	let views = this.views,
		window = this.getWindow(),
		path = (window ? window.file.getPath() + "/" : Dirs.EXTERNAL);
	this.pathes = new Array();
	views.layout.removeAllViews();
	delete this.lastPath;
	let current = window ? window.external : Dirs.EXTERNAL,
		pathFilter = path.replace(current, new String()),
		pathDivided = pathFilter.split("/");
	pathDivided.pop();
	this.addPathIcon("controlAdapterHome", current);
	for (let i = 0; i < pathDivided.length; i++) {
		current += pathDivided[i] + "/";
		if (pathDivided[i].length == 0) continue;
		this.addPathText(pathDivided[i], current);
	}
	return this;
};

ExplorerWindow.Path.prototype.setOnExploreListener = function(listener) {
	let scope = this;
	this.__explore = function(file) {
		tryout(function() {
			listener && listener(scope, file);
		});
	};
	return this;
};

ExplorerWindow.Path.prototype.setOnOutsideListener = function(listener) {
	this.__outside = function(scope) {
		tryout(function() {
			listener && listener(scope);
		});
	};
	return this;
};

ExplorerWindow.prototype.addPath = function(actionOrPath, action) {
	let path = actionOrPath instanceof ExplorerWindow.Path ?
		actionOrPath : new ExplorerWindow.Path(this, actionOrPath);
	action && actionOrPath instanceof ExplorerWindow.Path &&
		actionOrPath.setOnExploreListener(action);
	this.indexOfElement(path) == -1 && this.getElements().push(path);
	return path;
};

ExplorerWindow.Rename = function(parentOrAction, action) {
	this.reset();
	if (parentOrAction instanceof ExplorerWindow) {
		this.setWindow(parentOrAction);
		action && this.setOnApproveListener(action);
	} else parentOrAction && this.setOnApproveListener(parentOrAction);
	this.setHint(translate("File name"));
	this.setTitle(translate("Export"));
	this.setBackground("popup");
	this.formats = new Array();
};

ExplorerWindow.Rename.prototype.formatIndex = -1;

ExplorerWindow.Rename.prototype.reset = function() {
	let scope = this,
		views = this.views = new Object();
	let content = new android.widget.RelativeLayout(context);
	content.setId(java.lang.String("renameLayout").hashCode());
	let params = android.widget.RelativeLayout.LayoutParams(Interface.Display.MATCH, Interface.Display.WRAP);
	params.addRule(android.widget.RelativeLayout.ALIGN_PARENT_BOTTOM);
	content.setLayoutParams(params);
	this.content = content;

	views.approve = new android.widget.TextView(context);
	typeface && views.approve.setTypeface(typeface);
	views.approve.setSingleLine();
	views.approve.setTextColor(isInvertedLogotype() ? Interface.Color.WHITE : Interface.Color.GREEN);
	views.approve.setTextSize(Interface.getFontSize(27));
	views.approve.setId(java.lang.String("renameApprove").hashCode());
	views.approve.setPadding(Interface.getY(24), Interface.getY(24), Interface.getY(24), Interface.getY(24));
	views.approve.setOnClickListener(function() {
		scope.approve();
	});
	params = android.widget.RelativeLayout.LayoutParams(Interface.Display.WRAP, Interface.Display.WRAP);
	params.addRule(android.widget.RelativeLayout.ALIGN_PARENT_RIGHT);
	params.addRule(android.widget.RelativeLayout.CENTER_IN_PARENT);
	params.leftMargin = Interface.getY(24);
	content.addView(views.approve, params);

	views.format = new android.widget.TextView(context);
	typeface && views.format.setTypeface(typeface);
	views.format.setSingleLine();
	views.format.setTextColor(Interface.Color.WHITE);
	views.format.setTextSize(Interface.getFontSize(30));
	views.format.setId(java.lang.String("renameFormat").hashCode());
	views.format.setPadding(Interface.getY(16), Interface.getY(16), Interface.getY(16), Interface.getY(16));
	views.format.setOnClickListener(function() {
		scope.nextFormat();
	});
	params = android.widget.RelativeLayout.LayoutParams(Interface.Display.WRAP, Interface.Display.WRAP);
	params.addRule(android.widget.RelativeLayout.LEFT_OF, views.approve.getId());
	params.addRule(android.widget.RelativeLayout.CENTER_IN_PARENT);
	content.addView(views.format, params);

	views.name = new android.widget.EditText(context);
	views.name.setInputType(android.text.InputType.TYPE_CLASS_TEXT |
		android.text.InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
	views.name.setHintTextColor(Interface.Color.LTGRAY);
	views.name.setTextColor(Interface.Color.WHITE);
	views.name.setTextSize(Interface.getFontSize(24));
	typeface && views.name.setTypeface(typeface);
	params = android.widget.RelativeLayout.LayoutParams(Interface.Display.MATCH, Interface.Display.WRAP);
	params.addRule(android.widget.RelativeLayout.LEFT_OF, views.format.getId());
	params.addRule(android.widget.RelativeLayout.CENTER_IN_PARENT);
	params.setMargins(Interface.getY(8), Interface.getY(8), Interface.getY(8), Interface.getY(8));
	content.addView(views.name, params);
};

ExplorerWindow.Rename.prototype.getContent = function() {
	return this.content || null;
};

ExplorerWindow.Rename.prototype.getWindow = function() {
	return this.window || null;
};

ExplorerWindow.Rename.prototype.setWindow = function(window) {
	if (!window || typeof window != "object") return this;
	window.elements && window.elements.indexOf(this) == -1
		&& window.elements.push(this);
	let layout = window.views ? window.views.layout : null,
		content = this.getContent(),
		files = window.views ?
		window.views.files : null,
		scope = this;
	if (!layout || !content || !files) return this;
	let actor = new FadeActor();
	actor.setDuration(400);
	window.beginDelayedActor(actor);
	let params = files.getLayoutParams();
	params.addRule(android.widget.RelativeLayout.ABOVE, content.getId());
	layout.addView(content, 0);
	window.setOnSelectListener(function(window, file, item, previous) {
		if (previous == -1) scope.setCurrentName(file.getName());
	});
	this.window = window;
	return this;
};

ExplorerWindow.Rename.prototype.getBackground = function() {
	return this.background || null;
};

ExplorerWindow.Rename.prototype.setBackground = function(src) {
	let content = this.getContent();
	if (!(src instanceof Drawable)) {
		src = Drawable.parseJson.call(this, src);
	}
	src.attachAsBackground(content);
	this.background = src;
	return this;
};

ExplorerWindow.Rename.prototype.getCurrentName = function() {
	let name = String(this.views ? this.views.name ?
		this.views.name.getText().toString() : new String() : new String());
	if (name.length == 0) name = translate("project");
	return name + this.getCurrentFormat();
};

ExplorerWindow.Rename.prototype.setCurrentName = function(text) {
	if (!text) return;
	let format = Files.getNameExtension(text);
	if (format) this.setFormat("." + format);
	this.setName(Files.getNameWithoutExtension(text))
	return this;
};

ExplorerWindow.Rename.prototype.setName = function(text) {
	let content = this.getContent(),
		views = this.views;
	if (!content || !views) return this;
	views.name.setText(String(text));
	return this;
};

ExplorerWindow.Rename.prototype.getCurrentFile = function() {
	let window = this.getWindow(),
		directory = window ? window.getDirectory() : null;
	if (!directory) return null;
	return new java.io.File(directory, this.getCurrentName());
};

ExplorerWindow.Rename.prototype.approve = function() {
	this.__approve && this.__approve(this, this.getCurrentFile(), this.getCurrentName());
	return this;
};

ExplorerWindow.Rename.prototype.nextFormat = function() {
	if (!this.formats || this.formats.length == 0)
		return;
	if (this.formatIndex > this.formats.length - 2) {
		this.formatIndex = 0;
	} else this.formatIndex++;
	this.setFormat(this.formatIndex);
	return this;
};

ExplorerWindow.Rename.prototype.setFormat = function(indexOrFormat) {
	let index = typeof indexOrFormat == "number" ?
		indexOrFormat : this.formats.indexOf(indexOrFormat);
	let format = this.views ? this.views.format : null;
	if (!format || index < 0) return;
	this.formatIndex = index;
	format.setText(this.formats[index]);
	return this;
};

ExplorerWindow.Rename.prototype.getCurrentFormat = function() {
	return this.formats[this.formatIndex];
};

ExplorerWindow.Rename.prototype.setAvailabledTypes = function(types) {
	if (!Array.isArray(types)) {
		this.formats = [types];
	} else this.formats = types;
	this.formatIndex = -1;
	this.nextFormat();
	return this;
};

ExplorerWindow.Rename.prototype.getTitle = function() {
	let views = this.views;
	if (!views) return null;
	return views.approve.getText();
};

ExplorerWindow.Rename.prototype.setTitle = function(text) {
	let content = this.getContent(),
		views = this.views;
	if (!content || !views) return this;
	views.approve.setText(String(text).toUpperCase());
	return this;
};

ExplorerWindow.Rename.prototype.getHint = function() {
	let views = this.views;
	if (!views) return null;
	return views.name.getHint();
};

ExplorerWindow.Rename.prototype.setHint = function(text) {
	let content = this.getContent(),
		views = this.views;
	if (!content || !views) return this;
	views.name.setHint(String(text));
	return this;
};

ExplorerWindow.Rename.prototype.setOnApproveListener = function(listener) {
	this.__approve = function(rename, file, name) {
		tryout(function() {
			listener && listener(rename, file, name);
		});
	};
	return this;
};

ExplorerWindow.prototype.addRename = function(actionOrRename, action) {
	let rename = actionOrRename instanceof ExplorerWindow.Rename ?
		actionOrRename : new ExplorerWindow.Rename(this, actionOrRename);
	action && actionOrRename instanceof ExplorerWindow.Rename &&
		actionOrRename.setOnApproveListener(action);
	this.indexOfElement(rename) == -1 && this.getElements().push(rename);
	return rename;
};

const ExplorerAdapter = function(array, external, mode) {
	this.resetAndClear();
	array && this.setItems(array);
	external && this.setRoot(external);
	mode !== undefined && this.setMode(mode);
};

ExplorerAdapter.prototype = new JavaAdapter(android.widget.BaseAdapter, android.widget.Adapter, {
	array: new Array(),
	getCount: function() {
		return this.array.length;
	},
	getItemId: function(position) {
		return position;
	},
	getItems: function() {
		return this.array;
	},
	getItem: function(position) {
		let object = new Object();
		tryout.call(this, function() {
			object.isApproved = this.isApproved(position) == true;
			let file = this.getFile(position);
			object.file = file;
			object.isDirectory = file.isDirectory();
			let item = this.array[position];
			if (!object.isDirectory) {
				let extension = Files.getExtension(file);
				object.name = extension ? Files.getNameWithoutExtension(item) : item;
				if (extension) object.extension = extension.toUpperCase();
			} else object.name = item;
			object.type = Files.getExtensionType(file);
			let date = new java.util.Date(file.lastModified()),
				format = new java.text.SimpleDateFormat();
			format.applyPattern("d MMM, yyyy")
			object.date = format.format(date);
			format.applyPattern("k:mm")
			object.time = format.format(date);
			tryoutSafety.call(this, function() {
				if (object.isDirectory) object.filesCount = file.list().length;
				else object.size = Files.prepareSize(file);
			});
		});
		return object;
	},
	getApproved: function() {
		return this.approves;
	},
	getApprovedCount: function() {
		return this.approves.length;
	},
	getMode: function() {
		return this.mode;
	},
	getUnselectMode: function() {
		return this.basicMode;
	},
	getFile: function(position) {
		position = parseInt(position);
		return new java.io.File(this.direct, this.array[position]);
	},
	getApprovedFiles: function() {
		let files = new Array(),
			approves = this.getApproved();
		for (let i = 0; i < this.getApprovedCount(); i++) {
			files.push(this.getFile(approves[i]));
		}
		return files;
	},
	getView: function(position, convertView, parent) {
		let holder = tryout.call(this, function() {
			if (convertView == null) {
				let tag = new Object();
				convertView = this.makeItemLayout();
				tag.name = convertView.findViewWithTag("fileName");
				tag.bound = convertView.findViewWithTag("fileSize");
				tag.date = convertView.findViewWithTag("fileDate");
				tag.property = convertView.findViewWithTag("fileInfo");
				tag.icon = convertView.findViewWithTag("fileIcon");
				tag.drawable = new BitmapDrawable();
				tag.drawable.setCorruptedThumbnail("explorerFileCorrupted");
				tag.drawable.attachAsImage(tag.icon);
				convertView.setTag(tag);
			}
			return convertView.getTag();
		});
		let item = this.getItem(position);
		tryout.call(this, function() {
			(item.isApproved ? new BitmapDrawable("popupSelectionSelected") : new Drawable()).attachAsBackground(convertView);
			holder.name.setText(item.name);
			holder.bound.setText((item.extension ? item.extension : new String()) +
				(item.extension && item.size ? " / " : new String()) + (item.size ? item.size : new String()) +
				(item.isDirectory && item.filesCount !== undefined ? translateCounter(item.filesCount, "no files",
				"%s1 file", "%s" + (item.filesCount % 10) + " files", "%s files") : new String()));
			holder.drawable.setOptions();
			holder.date.setText(item.date);
			if (item.type == "image") {
				let size = Files.prepareBounds(item.file);
				if (size[0] + size[1] == -2) {
					holder.property.setText(item.time);
					holder.drawable.setBitmap("explorerFileCorrupted");
					return;
				}
				holder.property.setText(size.join("x") + " / " + item.time);
				if (size[0] <= maximumAllowedBounds && size[1] <= maximumAllowedBounds) {
					let options = Files.getThumbnailOptions(maximumThumbnailBounds, size);
					holder.drawable.setOptions(options);
					holder.drawable.setBitmap(item.file);
					return;
				}
			} else holder.property.setText(item.time);
			holder.drawable.setBitmap(item.isDirectory ? "explorerFolder" : item.type != "none" ?
				"explorerExtension" + item.type.charAt(0).toUpperCase() + item.type.substring(1) : "explorerFile");
		});
		return convertView;
	},
	isApproved: function(position) {
		position = parseInt(position);
		return this.approves.indexOf(position) != -1;
	},
	isCanBeApproved: function() {
		return this.getApprovedCount() > 0;
	},
	isDirectory: function(position) {
		return this.getFile(position).isDirectory();
	},
	makeItemLayout: function() {
		let layout = new android.widget.RelativeLayout(context);
		let params = android.view.ViewGroup.LayoutParams(Interface.Display.MATCH, Interface.Display.WRAP);
		layout.setLayoutParams(params);

		let icon = new android.widget.ImageView(context);
		icon.setPadding(Interface.getY(20), Interface.getY(20), Interface.getY(20), Interface.getY(20));
		icon.setScaleType(Interface.Scale.CENTER_CROP);
		icon.setTag("fileIcon");
		icon.setId(java.lang.String("fileIcon").hashCode());
		params = android.widget.RelativeLayout.LayoutParams(Interface.getY(75), Interface.getY(100));
		params.addRule(android.widget.RelativeLayout.ALIGN_PARENT_LEFT);
		params.addRule(android.widget.RelativeLayout.CENTER_IN_PARENT);
		params.rightMargin = Interface.getY(15);
		layout.addView(icon, params);

		let additional = new android.widget.LinearLayout(context);
		additional.setOrientation(Interface.Orientate.VERTICAL);
		additional.setGravity(Interface.Gravity.RIGHT);
		additional.setPadding(Interface.getY(30), 0, Interface.getY(30), 0);
		additional.setTag("additionalInfo");
		additional.setId(java.lang.String("additionalInfo").hashCode());
		params = android.widget.RelativeLayout.LayoutParams(Interface.Display.WRAP, Interface.Display.WRAP);
		params.addRule(android.widget.RelativeLayout.ALIGN_PARENT_RIGHT);
		params.addRule(android.widget.RelativeLayout.CENTER_IN_PARENT);
		layout.addView(additional, params);

		let date = new android.widget.TextView(context);
		typeface && date.setTypeface(typeface);
		date.setGravity(Interface.Gravity.RIGHT);
		date.setTextSize(Interface.getFontSize(21));
		date.setTextColor(Interface.Color.LTGRAY);
		date.setTag("fileDate");
		additional.addView(date);

		let info = new android.widget.TextView(context);
		typeface && info.setTypeface(typeface);
		info.setGravity(Interface.Gravity.RIGHT);
		info.setTextSize(Interface.getFontSize(21));
		info.setTextColor(Interface.Color.LTGRAY);
		info.setTag("fileInfo");
		additional.addView(info);

		let uniqal = new android.widget.LinearLayout(context);
		uniqal.setOrientation(Interface.Orientate.VERTICAL);
		uniqal.setTag("uniqalInfo");
		uniqal.setId(java.lang.String("uniqalInfo").hashCode());
		params = android.widget.RelativeLayout.LayoutParams(Interface.Display.WRAP, Interface.Display.WRAP);
		params.addRule(android.widget.RelativeLayout.LEFT_OF, additional.getId());
		params.addRule(android.widget.RelativeLayout.RIGHT_OF, icon.getId());
		params.addRule(android.widget.RelativeLayout.CENTER_IN_PARENT);
		uniqal.post(function() { uniqal.requestLayout(); });
		layout.addView(uniqal, params);

		let name = new android.widget.TextView(context);
		typeface && name.setTypeface(typeface);
		name.setTextSize(Interface.getFontSize(22.5));
		name.setTextColor(Interface.Color.WHITE);
		name.setTag("fileName");
		name.setMaxLines(3);
		uniqal.addView(name);

		let size = new android.widget.TextView(context);
		typeface && size.setTypeface(typeface);
		size.setTextSize(Interface.getFontSize(21));
		size.setTextColor(Interface.Color.LTGRAY);
		size.setTag("fileSize");
		uniqal.addView(size);
		return layout;
	},
	setItems: function(array) {
		this.array = array;
		this.unselectAll();
	},
	setMode: function(mode) {
		this.choice = mode;
	},
	setUnselectMode: function(mode) {
		this.basicMode = mode;
	},
	returnToBasic: function() {
		this.basicMode !== undefined && this.setMode(this.basicMode);
	},
	setRoot: function(external) {
		this.direct = external;
	},
	setOnSelectListener: function(listener) {
		this.__select = listener;
	},
	setOnUnselectListener: function(listener) {
		this.__unselect = listener;
	},
	selectItem: function(position) {
		position = parseInt(position);
		if (this.previous !== undefined) {
			let last = this.approves.indexOf(this.previous);
			if (last != -1 && this.choice == Interface.Choice.SINGLE) {
				this.approves.splice(last, 1);
			}
		}
		if (position !== undefined) {
			let selected = this.approves.indexOf(position);
			if (this.choice == Interface.Choice.SINGLE) {
				this.approves.push(position);
				this.previous = position;
				this.__select && this.__select(position, selected);
			} else if (selected != -1) {
				this.approves.splice(selected, 1);
				this.getApprovedCount() == 0 && this.returnToBasic();
				this.__unselect && this.__unselect(position, selected);
			} else if (this.choice == Interface.Choice.NONE) {
				let index = this.approves.push(position) - 1;
				this.__select && this.__select(position, selected);
				this.approves.splice(index, 1);
			} else {
				this.approves.push(position);
				this.__select && this.__select(position, selected);
			}
		}
		this.notifyDataSetChanged();
	},
	selectAll: function() {
		this.approves = new Array();
		for (let i = 0; i < this.getCount(); i++) {
			this.approves.push(this.getItemId(i));
		}
		this.notifyDataSetChanged();
	},
	invertSelection: function() {
		let approves = new Array();
		for (let i = 0; i < this.getCount(); i++) {
			approves.push(approves.indexOf(this.getItemId(i)) == -1);
		}
		this.approves = approves;
		this.notifyDataSetChanged();
	},
	unselectAll: function() {
		this.approves = new Array();
		this.returnToBasic();
		this.notifyDataSetChanged();
	},
	resetAndClear: function() {
		this.__select = undefined;
		this.__unselect = undefined;
		this.direct = __dir__;
		this.array = new Array();
		this.choice = Interface.Choice.NONE;
		this.basicMode = Interface.Choice.NONE;
		this.unselectAll();
	}
});
