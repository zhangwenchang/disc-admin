$(function() {

	var menu = $('#side-menu'), root = [], nodes = {};
	$(project.resources).each(function() {
		if (this.parentResourceId == null) {
			root.push(this);
		} else {
			var parent = nodes[this.parentResourceId] || [];
			parent.push(this);
			nodes[this.parentResourceId] = parent;
		}
	});

	var render = function(i) {

		var html = [ '<div class="accordion-group sidebar-nav-group"><a href="' ];
		var inodes = nodes[this.resourceId];

		if (inodes && inodes.length > 0) {
			html.push('#ID_');
			html.push(this.resourceId);
			html
					.push('" class="nav-header" data-toggle="collapse"	data-parent="#side-menu"><i class=" style="margin-left:10px"></i>');
			html.push(this.name);
			html.push('</a><ul id="ID_');
			html.push(this.resourceId);
			html.push('" class="nav nav-list collapse">');

			$(inodes).each(function() {
				html.push('<li><a href="');
				html.push(project.context);
				html.push(this.url);
				html.push('">');
				html.push(this.name);
				html.push('</a></li>');
			});

			html.push('</ul></div>');

		} else {
			html.push(project.context);
			html.push(this.url);
			html
					.push('" class="nav-header"><i class=" style="margin-left:10px"></i>');
			html.push(this.name);
			html.push('</a>');
		}

		menu.append(html.join(''));
	};
	$(root).each(render);

	var url = location.pathname, collapsedIn = false, caption = project.caption;

	$(".sidebar-nav  a").each(function() {

		var alink = $(this), uri = $.trim(alink.attr('href'));

		if (url == uri || url.slice(-uri.length) == uri) {

			alink.parents('ul').addClass('in');
			alink.parents('li').addClass('active');

			$('#title-caption').html(alink.html());

			caption = alink.html();

			collapsedIn = true;
		}

	});

	if (!collapsedIn) {
		$('#title-caption').html(project.caption);
	}

/*	if (project.authenticated) {
		$('#ssouser').removeClass("hide");
		$('#ssoname').html(decodeURI(project.userName));
	}

	var applications = $('#applications');
	var renderApplications = function() {
		if (this.appCode != project.appCode) {
			applications.append([ '<li><a target="_blank" href="', this.url,
					'">', this.name, '</a></li>' ].join(''));
		}
	}
	$.each(project.applications, renderApplications);*/

});
