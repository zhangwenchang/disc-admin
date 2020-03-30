!function($) {

	function format(message, args) {
		if (args && args.length > 0) {
			for ( var i = 0, len = args.length; i < len; i++) {
				message = message.replace('{' + i + '}', args[i]);
			}
		}
		return message;
	}

	function clear() {
		var group = $(this).parent().parent('.control-group');
		var help = group.find('.help-inline');

		if (help.data('append')) {
			help.html('');
			help.data('append', false);
		}

		group.removeClass('error');
		help.addClass('hide');
	}

	function notify(field, message) {
		var inPage = field.hasClass('in');
		var group = field.parent().parent('.control-group');
		var help = group.find('.help-inline');

		group.addClass("error");

		if (!inPage) {
			Dialog.alert(message);
		}
		if ($.trim(help.html()) == '') {
			help.html(message.substring(message.indexOf('】') + 1));
			help.data('append', true);
		}
		help.removeClass('hide');
	}
	// 必填

	function required(e) {
		
		if(e&&e.isDefaultPrevented()){
			return true;
		}

		var field = $(this), value = $.trim(field.val()), label = field
				.attr('label');

		var max = Number(field.attr('max-length') || -1);
		var min = Number(field.attr('min-length') || -1);

		var length = value.length;

		if (!value || length < 0) {

			notify(field, format(messages.required, [ label ]));
			e&&e.preventDefault();
			return false;
		}

		if (max > 0 && length > max) {

			notify(field, format(messages.maxLength, [ label, max ]));
			return false;

		}

		if (min > 0 && length < min) {

			notify(field, format(messages.minLength, [ label, min ]));
			e&&e.preventDefault();
			return false;

		}

		return true;

	}

	// 数字
	function num(e) {
		
		if(e&&e.isDefaultPrevented()){
			return true;
		}

		var field = $(this), value = $.trim(field.val()), label = field
				.attr('label');

		if (value == '') {
			return true;
		}

		var scale = Number(field.attr('scale') || 0);

		if (scale > 0) {

			var regexp = new RegExp([ '^[0-9]\\d*\\.\\d{1,', scale, '}$' ]
					.join(''));
			if (!regexp.test(value)) {
				notify(field, format(messages.numberScale, [ label, scale ]));
				return false;
			}

		} else {
			if (!/^[0-9]\d*$/.test(value)) {
				notify(field, format(messages.number, [ label ]));
				e&&e.preventDefault();
				return false;
			}
		}

		return true;
	}

	// 邮件
	function mail(e) {
		
		if(e.isDefaultPrevented()){
			return true;
		}

		var field = $(this), value = $.trim(field.val()), label = field
				.attr('label');

		if (value == '') {
			return true;
		}

		var delimiter = $.trim(field.attr('delimiter'));

		var addresses = null;

		if (delimiter.length > 0) {
			addresses = value.split(delimiter);
		} else {
			addresses = [ value ];
		}
		var regexp = /^[a-zA-Z0-9]{1}([\._a-zA-Z0-9-]+)(\.[_a-zA-Z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+){1,3}$/;
		for ( var i = 0, length = addresses.length; i < length; i++) {

			if (!regexp.test(addresses[i])) {
				notify(field, format(messages.mail, [ label ]));
				e&&e.preventDefault();
				return false;
			}

		}

		return true;
	}

	// 比较
	function equal(e) {
		
		if(e&&e.isDefaultPrevented()){
			return true;
		}

		var field = $(this), value = $.trim(field.val()), label = field
				.attr('label');

		if (value == '') {
			return true;
		}

		var aim = $(field.attr('data-equal'));
		if (aim.length == 0) {
			return true;
		}

		if ($.trim(aim.val()) != value) {
			notify(field, format(messages.equal, [ label, aim.attr('label') ]));
			e&&e.preventDefault();
			return false;
		}
		return true;

	}

	// 正则表达式
	function regexp(e) {
		
		if(e&&e.isDefaultPrevented()){
			return true;
		}

		var field = $(this), value = $.trim(field.val()), label = field
				.attr('label');

		if (value == '') {
			return true;
		}

		var regexp = $.trim(field.attr('data-regexp'));
		if (regexp.length == 0) {
			return true;
		}
		
		if (!eval(regexp).test(value)) {
			notify(field, format(messages.regexp, [ label, regexp ]));
			e&&e.preventDefault();
			return false;
		}
		return true;

	}

	// Ajax验证
	function remoting(e) {
		
		if(e&&e.isDefaultPrevented()){
			return true;
		}
		
		var field = $(this), value = $.trim(field.val()), label = field
				.attr('label');

		if (value == '') {
			return true;
		}
		var group = field.parent().parent('.control-group');
		var result = field.data('result'), ajax = field.attr('ajax');
		if (typeof (result) == "undefined") {
			var options = (new Function([ 'return ', ajax, '.call(this);' ]
					.join(''))).call(field);
			var success = options.success;
			options.success = function(data, status, xhr) {
				var result = success(data, status, xhr);
				field.data('result', result);
				refresh.remove();
				if (result) {
					clear.call(field);
				} else {
					notify(field, format(messages.remoting, [ label ]));
				}
			}
			var refresh = $('<i class="icon-refresh"></i>');
			if (group.find('.icon-refresh').length == 0) {
				field.after(refresh);
			}
			$.ajax(options);
			e&&e.preventDefault();
			return false;
		} else if (!result) {
			notify(field, format(messages.remoting, [ label ]));
			e&&e.preventDefault();
			return false;
		}

		return true;
	}

	function validate(option) {
		var pass = true;

		this.find('.required').each(function() {

			if (option == 'clear') {
				clear.call(this);
			} else {
				if (pass) {
					pass = required.call(this);
				} else {
					return false;
				}
			}

		});

		this.find('.number').each(function() {

			if (option == 'clear') {
				clear.call(this);
			} else {
				if (pass) {
					pass = num.call(this);
				} else {
					return false;
				}
			}

		});

		this.find('.mail').each(function() {

			if (option == 'clear') {
				clear.call(this);
			} else {
				if (pass) {
					pass = mail.call(this);
				} else {
					return false;
				}
			}

		});

		this.find('.equal').each(function() {

			if (option == 'clear') {
				clear.call(this);
			} else {
				if (pass) {
					pass = equal.call(this);
				} else {
					return false;
				}
			}

		});

		this.find('.regexp').each(function() {

			if (option == 'clear') {
				clear.call(this);
			} else {
				if (pass) {
					pass = regexp.call(this);
				} else {
					return false;
				}
			}

		});

		this.find('.remoting').each(function() {

			if (option == 'clear') {
				clear.call(this);
				$(this).parent().parent().find('.icon-refresh').remove();
			} else {
				if (pass) {
					pass = remoting.call(this);
				} else {
					return false;
				}
			}

		});

		$(this).data('pass', pass);

		return pass;
	}

	$.fn.validate = validate;

	var messages = $.fn.validate.messages = {
		required : "字段【{0}】不能为空!",
		maxLength : "字段【{0}】长度不能大于 {1}!",
		minLength : "字段【{0}】长度不能小于 {1}!",
		number : "字段【{0}】不是整数数字!",
		numberScale : "字段【{0}】不是带小数的数字或者小数位超过 {1}!",
		mail : "字段【{0}】输入的不是有效的邮件地址!",
		equal : "字段【{0}】与字段【{1}】输入的内容不相同!",
		remoting : "字段【{0}】远程验证失败!",
		regexp : "字段【{0}】不匹配表达式【{1}】!",
	};

	$(function() {

		$('.form-validate .required').each(function() {

			var field = $(this);

			if (field.hasClass('blur')) {

				field.blur(required);

			}

			field.keydown(clear).change(clear);

		});

		$('.form-validate .number').each(function() {

			var field = $(this);

			if (field.hasClass('blur')) {

				field.blur(num);

			}

			field.keydown(clear).change(clear);

		});

		$('.form-validate .mail').each(function() {

			var field = $(this);

			if (field.hasClass('blur')) {

				field.blur(mail);

			}

			field.keydown(clear).change(clear);

		});

		$('.form-validate .equal').each(function() {

			var field = $(this);

			if (field.hasClass('blur')) {

				field.blur(equal);

			}

			field.keydown(clear).change(clear);

		});

		$('.form-validate .regexp').each(function() {

			var field = $(this);

			if (field.hasClass('blur')) {

				field.blur(regexp);

			}

			field.keydown(clear).change(clear);

		});

		$('.form-validate .remoting').each(function() {

			var field = $(this);

			if (field.hasClass('blur')) {

				field.blur(remoting);

			}

			var cleardata = function() {
				field.removeData('result');
				clear.call(field);
			}

			field.keydown(cleardata).change(cleardata);

		});

		$('.form-validate').submit(function() {
			return $(this).validate();
		});

	});

}(jQuery);