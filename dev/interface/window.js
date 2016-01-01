const FocusableWindow = new Function();

FocusableWindow.prototype.TYPE = "FocusableWindow";

FocusableWindow.prototype.touchable = true;
FocusableWindow.prototype.focusable = false;
FocusableWindow.prototype.gravity = Ui.Gravity.NONE;
FocusableWindow.prototype.width = Ui.Display.WRAP;
FocusableWindow.prototype.height = Ui.Display.WRAP;
FocusableWindow.prototype.x = 0;
FocusableWindow.prototype.y = 0;

FocusableWindow.prototype.getContent = function() {
	if (this.content) return this.content;
	let fragment = this.getFragment();
	if (fragment != null) {
		let container = fragment.getContainer();
		if (container != null) return container;
	}
	let frame = this.getFrame();
	if (frame != null) {
		let container = frame.getContainer();
		if (container != null) return container;
	}
	return null;
};

FocusableWindow.prototype.setContent = function(content) {
	this.content = content;
	if (this.isOpened()) this.update();
	else content.setVisibility(Ui.Visibility.GONE);
};

FocusableWindow.prototype.getFragment = function() {
	if (this.fragment) return this.fragment;
	let frame = this.getFrame();
	if (frame == null) return null;
	return frame.getFragment();
};

FocusableWindow.prototype.setFragment = function(fragment) {
	this.fragment = fragment;
	if (this.isOpened()) this.update();
	else fragment.getContainer().setVisibility(Ui.Visibility.GONE);
};

FocusableWindow.prototype.getFrame = function() {
	return this.frame || null;
};

FocusableWindow.prototype.setFrame = function(frame) {
	this.frame = frame;
	if (this.isOpened()) this.update();
	else frame.getContainer().setVisibility(Ui.Visibility.GONE);
};

FocusableWindow.prototype.isTouchable = function() {
	return this.touchable;
};

FocusableWindow.prototype.setTouchable = function(touchable) {
	this.touchable = !!touchable;
};

FocusableWindow.prototype.isFocusable = function() {
	return this.focusable;
};

FocusableWindow.prototype.setFocusable = function(focusable) {
	this.focusable = !!focusable;
};

FocusableWindow.prototype.isFullscreen = function() {
	return (this.width == Ui.Display.MATCH || this.width == Ui.Display.WIDTH) &&
		(this.height == Ui.Display.MATCH || this.height == Ui.Display.HEIGHT);
};

FocusableWindow.prototype.getParams = function(flags) {
	let params = new android.view.WindowManager.LayoutParams(this.width, this.height,
		this.x, this.y, 1000, flags || WindowProvider.BASE_WINDOW_FLAGS, -3);
	return (params.gravity = this.gravity, params);
};

FocusableWindow.prototype.getGravity = function() {
	return this.gravity;
};

FocusableWindow.prototype.setGravity = function(gravity) {
	this.gravity = gravity;
};

FocusableWindow.prototype.getX = function() {
	return this.x;
};

FocusableWindow.prototype.getY = function() {
	return this.y;
};

FocusableWindow.prototype.setX = function(x) {
	this.x = parseInt(x);
};

FocusableWindow.prototype.setY = function(y) {
	this.y = parseInt(y);
};

FocusableWindow.prototype.getWidth = function() {
	return this.width;
};

FocusableWindow.prototype.getHeight = function() {
	return this.height;
};

FocusableWindow.prototype.setWidth = function(width) {
	this.width = parseInt(width);
};

FocusableWindow.prototype.setHeight = function(height) {
	this.height = parseInt(height);
};

FocusableWindow.prototype.setOnShowListener = function(listener) {
	this.__show = function() {
		try { listener && listener(); }
		catch (e) { reportError(e); }
	};
};

FocusableWindow.prototype.setOnUpdateListener = function(listener) {
	this.__update = function() {
		try { listener && listener(); }
		catch (e) { reportError(e); }
	};
};

FocusableWindow.prototype.setOnHideListener = function(listener) {
	this.__hide = function() {
		try { listener && listener(); }
		catch (e) { reportError(e); }
	};
};

FocusableWindow.prototype.setOnCloseListener = function(listener) {
	this.__close = function() {
		try { listener && listener(); }
		catch (e) { reportError(e); }
	};
};

FocusableWindow.prototype.isOpened = function() {
	return !!this.popupId;
};

FocusableWindow.prototype.getPopup = function() {
	return WindowProvider.getByPopupId(this.popupId);
};

FocusableWindow.prototype.setEnterActor = function(actor) {
	if (this.isOpened()) {
		WindowProvider.setEnterActor(this.popupId, actor);
	}
	if (actor) {
		this.enterActor = actor;
	}
};

FocusableWindow.prototype.setExitActor = function(actor) {
	if (this.isOpened()) {
		WindowProvider.setExitActor(this.popupId, actor);
	}
	if (actor) {
		this.exitActor = actor;
	}
};

FocusableWindow.prototype.show = function() {
	let scope = this, content = this.getContent();
	content.post(function() {
		WindowProvider.prepareActors(scope, scope.enterActor);
		content.setVisibility(Ui.Visibility.VISIBLE);
	});
	if (!this.isOpened()) {
		WindowProvider.openWindow(this);
	}
	this.__show && this.__show();
};

FocusableWindow.prototype.update = function() {
	WindowProvider.updateWindow(this);
	this.__update && this.__update();
};

FocusableWindow.prototype.hide = function() {
	WindowProvider.prepareActors(this, this.exitActor);
	this.getContent().setVisibility(Ui.Visibility.GONE);
	this.__hide && this.__hide();
};

FocusableWindow.prototype.dismiss = function() {
	WindowProvider.prepareActors(this, this.exitActor);
	this.getContent().setVisibility(Ui.Visibility.GONE);
	WindowProvider.closeWindow(this);
	this.__close && this.__close();
};
