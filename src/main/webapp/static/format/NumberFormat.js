(function() {
	function _format(pattern, num, z) {
		var j = pattern.length >= num.length ? pattern.length : num.length;
		var p = pattern.split("");
		var n = num.split("");
		var bool = true, nn = "";
		for ( var i = 0; i < j; i++) {
			var x = n[n.length - j + i];
			var y = p[p.length - j + i];
			if (z == 0) {
				if (bool) {
					if ((x && y && (x != "0" || y == "0"))
							|| (x && x != "0" && !y) || (y && y == "0" && !x)) {
						nn += x ? x : "0";
						bool = false;
					}
				} else {
					nn += x ? x : "0";
				}
			} else {
				if (y && (y == "0" || (y == "#" && x)))
					nn += x ? x : "0";
			}
		}
		return nn;
	}
	function _formatNumber(numChar, pattern) {
		var patterns = pattern.split(".");
		var numChars = numChar.split(".");
		var z = patterns[0].indexOf(",") == -1 ? -1 : patterns[0].length
				- patterns[0].indexOf(",");
		var num1 = _format(patterns[0].replace(","), numChars[0], 0);
		var num2 = _format(patterns[1] ? patterns[1].split('').reverse().join(
				'') : "", numChars[1] ? numChars[1].split('').reverse()
				.join('') : "", 1);
		num1 = num1.split("").reverse().join('');
		var reCat = eval("/[0-9]{" + (z - 1) + "," + (z - 1) + "}/gi");
		var arrdata = z > -1 ? num1.match(reCat) : undefined;
		if (arrdata && arrdata.length > 0) {
			var w = num1.replace(arrdata.join(''), '');
			num1 = arrdata.join(',') + (w == "" ? "" : ",") + w;
		}
		num1 = num1.split("").reverse().join("");
		return (num1 == "" ? "0" : num1)
				+ (num2 != "" ? "." + num2.split("").reverse().join('') : "");
	}
	function formatNumber(num, opt) {
		var reCat = /[0#,.]{1,}/gi;
		var zeroExc = opt.zeroExc == undefined ? true : opt.zeroExc;
		var pattern = opt.pattern.match(reCat)[0];
		var numChar = num.toString();
		return !(zeroExc && numChar == 0) ? opt.pattern.replace(pattern,
				_formatNumber(numChar, pattern)) : opt.pattern.replace(pattern,
				"0");
	}

	Number.prototype.format = function(format) {
		return formatNumber(this, {pattern:format});
	}
})();