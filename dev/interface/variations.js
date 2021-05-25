const ActoredWindow = function() {
	this.reset();
};

ActoredWindow.prototype = assign(FocusableWindow.prototype);
ActoredWindow.prototype.TYPE = "ActoredWindow";

ActoredWindow.prototype.reset = function() {
	this.manager = new ActorManager();
};

ActoredWindow.prototype.hasScene = function(scene) {
	return this.manager.hasScene(scene);
};

ActoredWindow.prototype.setActor = function(sceneFromOrTo, sceneToOrActor, actor) {
	return this.manager.setActor(sceneFromOrTo, sceneToOrActor, actor);
};

ActoredWindow.prototype.actorTo = function(scene) {
	this.manager.actorTo(scene);
};

ActoredWindow.prototype.beginDelayedActor = function(containerOrActor, actor) {
	let content = this.getContent();
	if (content == null) return;
	ActorManager.beginDelayedActor(actor ? containerOrActor : content, actor || containerOrActor);
};

ActoredWindow.prototype.endActors = function(container) {
	let content = this.getContent();
	if (content == null) return;
	ActorManager.endActors(container || content);
};

ActoredWindow.prototype.makeScene = function(rootOrContainer, container) {
	let content = this.getContent();
	if (content == null) return null;
	return new ActorScene(rootOrContainer || content, container);
};

const UniqueWindow = new Function();

UniqueWindow.prototype = assign(ActoredWindow.prototype);
UniqueWindow.prototype.TYPE = "UniqueWindow";
UniqueWindow.prototype.updatable = false;

UniqueWindow.prototype.isAttached = function() {
	return UniqueHelper.isAttached(this);
};

UniqueWindow.prototype.canBeOpened = function() {
	return !this.isOpened();
};

UniqueWindow.prototype.isUpdatable = function() {
	return this.updatable;
};

UniqueWindow.prototype.setIsUpdatable = function(enabled) {
	this.updatable = !!enabled;
};

UniqueWindow.prototype.__showUW = UniqueWindow.prototype.show;
UniqueWindow.prototype.show = function() {
  let window = this;
  context.runOnUiThread(function() {
	  if (UniqueHelper.prepareWindow(window)) {
	  	window.__showUW && window.__showUW();
	  }
  });
};

UniqueWindow.prototype.__dismissUW = UniqueWindow.prototype.dismiss;
UniqueWindow.prototype.dismiss = function() {
  let window = this;
  context.runOnUiThread(function() {
	  if (UniqueHelper.deattachWindow(window)) {
	  	window.__dismissUW && window.__dismissUW();
	  }
  });
};

const FocusablePopup = function() {
	let set = new ActorSet(),
		fadeIn = new FadeActor(),
		fadeOut = new FadeActor();
	fadeIn.setInterpolator(new DecelerateInterpolator());
	fadeIn.setMode(FadeActor.IN);
	fadeIn.setDuration(400);
	set.addActor(fadeIn);
	fadeOut.setInterpolator(new AccelerateDecelerateInterpolator());
	fadeOut.setMode(FadeActor.OUT);
	fadeOut.setDuration(400);
	set.addActor(fadeOut);
	
	this.setEnterActor(set);
	this.setExitActor(set);
	
	let place = Popups.getAvailablePlace();
	this.setX(place.x), this.setY(place.y);
	
	this.reset();
};

FocusablePopup.prototype = assign(ActoredWindow.prototype);
FocusablePopup.prototype.TYPE = "FocusablePopup";

FocusablePopup.prototype.expanded = true;

FocusablePopup.prototype.reset = function() {
	let views = this.views = new Object();
	views.layout = new android.widget.LinearLayout(context);
	views.layout.setBackgroundDrawable(ImageFactory.getDrawable("popupBackground"));
	views.layout.setOrientation(Ui.Orientate.VERTICAL);
	this.setContent(views.layout);
	
	views.title = new android.widget.TextView(context);
	views.title.setPadding(Ui.getY(30), Ui.getY(18), Ui.getY(30), Ui.getY(18));
	views.title.setBackgroundDrawable(ImageFactory.getDrawable("popupBackground"));
	views.title.setTextSize(Ui.getFontSize(24));
	views.title.setGravity(Ui.Gravity.CENTER);
	views.title.setTextColor(Ui.Color.WHITE);
	views.title.setTypeface(typeface);
	params = new android.widget.LinearLayout.
		LayoutParams(Ui.Display.MATCH, Ui.Display.MATCH);
	params.weight = 0.1;
	views.layout.addView(views.title, params);
	
	views.scroll = new android.widget.ScrollView(context);
	params = new android.widget.LinearLayout.
		LayoutParams(Ui.Display.MATCH, Ui.Display.MATCH);
	params.weight = 16.0;
	views.layout.addView(views.scroll, params);
	
	views.content = new android.widget.LinearLayout(context);
	views.content.setOrientation(Ui.Orientate.VERTICAL);
	views.content.setGravity(Ui.Gravity.CENTER);
	views.scroll.addView(views.content);
};

FocusablePopup.prototype.setTitle = function(title) {
	this.views.title.setText(title);
};

FocusablePopup.prototype.isExpanded = function() {
	return this.expanded;
};

FocusablePopup.prototype.expand = function() {
	if (this.isExpanded()) {
		this.minimize();
	} else this.maximize();
};

FocusablePopup.prototype.minimize = function() {
	let actor = new FadeActor();
	actor.setDuration(200);
	this.beginDelayedActor(actor);
	this.views.scroll.setVisibility(Ui.Visibility.GONE);
	this.expanded = false;
};

FocusablePopup.prototype.maximize = function() {
	let actor = new FadeActor();
	actor.setDuration(400);
	this.beginDelayedActor(actor);
	this.views.scroll.setVisibility(Ui.Visibility.VISIBLE);
	this.expanded = true;
};