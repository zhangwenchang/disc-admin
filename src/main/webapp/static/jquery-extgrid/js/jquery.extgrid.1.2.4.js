/*!
 * artTemplate - Template Engine
 * https://github.com/aui/artTemplate
 * Released under the MIT, BSD, and GPL Licenses
 */
 

/**
 * 模板引擎路由函数
 * 若第二个参数类型为 Object 则执行 render 方法, 否则 compile 方法
 * @name    template
 * @param   {String}            模板ID (可选)
 * @param   {Object, String}    数据或者模板字符串
 * @return  {String, Function}  渲染好的HTML字符串或者渲染方法
 */
var template = function (id, content) {
    return template[
        typeof content === 'object' ? 'render' : 'compile'
    ].apply(template, arguments);
};




(function (exports, global) {


'use strict';
exports.version = '2.0.1'; 
exports.openTag = '<%';     // 设置逻辑语法开始标签
exports.closeTag = '%>';    // 设置逻辑语法结束标签
exports.isEscape = true;    // HTML字符编码输出开关
exports.isCompress = false; // 剔除渲染后HTML多余的空白开关
exports.parser = null;      // 自定义语法插件接口



/**
 * 渲染模板
 * @name    template.render
 * @param   {String}    模板ID
 * @param   {Object}    数据
 * @return  {String}    渲染好的HTML字符串
 */
exports.render = function (id, data) {

    var cache = _getCache(id);
    
    if (cache === undefined) {

        return _debug({
            id: id,
            name: 'Render Error',
            message: 'No Template'
        });
        
    }
    
    return cache(data); 
};



/**
 * 编译模板
 * 2012-6-6:
 * define 方法名改为 compile,
 * 与 Node Express 保持一致,
 * 感谢 TooBug 提供帮助!
 * @name    template.compile
 * @param   {String}    模板ID (可选)
 * @param   {String}    模板字符串
 * @return  {Function}  渲染方法
 */
exports.compile = function (id, source) {
    
    var params = arguments;
    var isDebug = params[2];
    var anonymous = 'anonymous';
    
    if (typeof source !== 'string') {
        isDebug = params[1];
        source = params[0];
        id = anonymous;
    }

    
    try {
        
        var Render = _compile(source, isDebug);
        
    } catch (e) {
    
        e.id = id || source;
        e.name = 'Syntax Error';

        return _debug(e);
        
    }
    
    
    function render (data) {
        
        try {
            
            return new Render(data) + '';
            
        } catch (e) {
            
            if (!isDebug) {
                return exports.compile(id, source, true)(data);
            }

            e.id = id || source;
            e.name = 'Render Error';
            e.source = source;
            
            return _debug(e);
            
        }
        
    }
    

    render.prototype = Render.prototype;
    render.toString = function () {
        return Render.toString();
    };
    
    
    if (id !== anonymous) {
        _cache[id] = render;
    }

    
    return render;

};




/**
 * 添加模板辅助方法
 * @name    template.helper
 * @param   {String}    名称
 * @param   {Function}  方法
 */
exports.helper = function (name, helper) {
    exports.prototype[name] = helper;
};




/**
 * 模板错误事件
 * @name    template.onerror
 * @event
 */
exports.onerror = function (e) {
    var content = '[template]:\n'
        + e.id
        + '\n\n[name]:\n'
        + e.name;

    if (e.message) {
        content += '\n\n[message]:\n'
        + e.message;
    }
    
    if (e.line) {
        content += '\n\n[line]:\n'
        + e.line;
        content += '\n\n[source]:\n'
        + e.source.split(/\n/)[e.line - 1].replace(/^[\s\t]+/, '');
    }
    
    if (e.temp) {
        content += '\n\n[temp]:\n'
        + e.temp;
    }
    
    if (global.console) {
        console.error(content);
    }
};



// 编译好的函数缓存
var _cache = {};



// 获取模板缓存
var _getCache = function (id) {

    var cache = _cache[id];
    
    if (cache === undefined && 'document' in global) {
        var elem = document.getElementById(id);
        
        if (elem) {
            var source = elem.value || elem.innerHTML;
            return exports.compile(id, source.replace(/^\s*|\s*$/g, ''));
        }
        
    } else if (_cache.hasOwnProperty(id)) {
    
        return cache;
    }
};



// 模板调试器
var _debug = function (e) {

    exports.onerror(e);
    
    function error () {
        return error + '';
    }
    
    error.toString = function () {
        return '{Template Error}';
    };
    
    return error;
};



// 模板编译器
var _compile = (function () {


    // 辅助方法集合
    exports.prototype = {
        $render: exports.render,
        $escape: function (content) {

            return typeof content === 'string'
            ? content.replace(/&(?![\w#]+;)|[<>"']/g, function (s) {
                return {
                    "<": "&#60;",
                    ">": "&#62;",
                    '"': "&#34;",
                    "'": "&#39;",
                    "&": "&#38;"
                }[s];
            })
            : content;
        },
        $string: function (value) {

            if (typeof value === 'string' || typeof value === 'number') {

                return value;

            } else if (typeof value === 'function') {

                return value();

            } else {

                return '';

            }

        }
    };


    var arrayforEach = Array.prototype.forEach || function (block, thisObject) {
        var len = this.length >>> 0;
        
        for (var i = 0; i < len; i++) {
            if (i in this) {
                block.call(thisObject, this[i], i, this);
            }
        }
        
    };


    // 数组迭代
    var forEach = function (array, callback) {
        arrayforEach.call(array, callback);
    };


    // 静态分析模板变量
    var KEYWORDS =
        // 关键字
        'break,case,catch,continue,debugger,default,delete,do,else,false'
        + ',finally,for,function,if,in,instanceof,new,null,return,switch,this'
        + ',throw,true,try,typeof,var,void,while,with'
        
        // 保留字
        + ',abstract,boolean,byte,char,class,const,double,enum,export,extends'
        + ',final,float,goto,implements,import,int,interface,long,native'
        + ',package,private,protected,public,short,static,super,synchronized'
        + ',throws,transient,volatile'
        
        // ECMA 5 - use strict
        + ',arguments,let,yield'

        + ',undefined';
    var REMOVE_RE = /\/\*(?:.|\n)*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|'[^']*'|"[^"]*"|[\s\t\n]*\.[\s\t\n]*[$\w\.]+/g;
    var SPLIT_RE = /[^\w$]+/g;
    var KEYWORDS_RE = new RegExp(["\\b" + KEYWORDS.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g');
    var NUMBER_RE = /\b\d[^,]*/g;
    var BOUNDARY_RE = /^,+|,+$/g;
    var getVariable = function (code) {

        code = code
        .replace(REMOVE_RE, '')
        .replace(SPLIT_RE, ',')
        .replace(KEYWORDS_RE, '')
        .replace(NUMBER_RE, '')
        .replace(BOUNDARY_RE, '');

        code = code ? code.split(/,+/) : [];

        return code;
    };


    return function (source, isDebug) {
        
        var openTag = exports.openTag;
        var closeTag = exports.closeTag;
        var parser = exports.parser;

        
        var code = source;
        var tempCode = '';
        var line = 1;
        var uniq = {$data:true,$helpers:true,$out:true,$line:true};
        var helpers = exports.prototype;
        var prototype = {};

        
        var variables = "var $helpers=this,"
        + (isDebug ? "$line=0," : "");

        var isNewEngine = ''.trim;// '__proto__' in {}
        var replaces = isNewEngine
        ? ["$out='';", "$out+=", ";", "$out"]
        : ["$out=[];", "$out.push(", ");", "$out.join('')"];

        var concat = isNewEngine
            ? "if(content!==undefined){$out+=content;return content}"
            : "$out.push(content);";
              
        var print = "function(content){" + concat + "}";

        var include = "function(id,data){"
        +     "if(data===undefined){data=$data}"
        +     "var content=$helpers.$render(id,data);"
        +     concat
        + "}";
        
        
        // html与逻辑语法分离
        forEach(code.split(openTag), function (code, i) {
            code = code.split(closeTag);
            
            var $0 = code[0];
            var $1 = code[1];
            
            // code: [html]
            if (code.length === 1) {
                
                tempCode += html($0);
             
            // code: [logic, html]
            } else {
                
                tempCode += logic($0);
                
                if ($1) {
                    tempCode += html($1);
                }
            }
            

        });
        
        
        
        code = tempCode;
        
        
        // 调试语句
        if (isDebug) {
            code = 'try{' + code + '}catch(e){'
            +       'e.line=$line;'
            +       'throw e'
            + '}';
        }
        
        
        code = "'use strict';"
        + variables + replaces[0] + code
        + 'return new String(' + replaces[3] + ')';
        
        
        try {
            
            var Render = new Function('$data', code);
            Render.prototype = prototype;

            return Render;
            
        } catch (e) {
            e.temp = 'function anonymous($data) {' + code + '}';
            throw e;
        }



        
        // 处理 HTML 语句
        function html (code) {
            
            // 记录行号
            line += code.split(/\n/).length - 1;

            if (exports.isCompress) {
                code = code.replace(/[\n\r\t\s]+/g, ' ');
            }
            
            code = code
            // 单引号与反斜杠转义(因为编译后的函数默认使用单引号，因此双引号无需转义)
            .replace(/('|\\)/g, '\\$1')
            // 换行符转义(windows + linux)
            .replace(/\r/g, '\\r')
            .replace(/\n/g, '\\n');
            
            code = replaces[1] + "'" + code + "'" + replaces[2];
            
            return code + '\n';
        }
        
        
        // 处理逻辑语句
        function logic (code) {

            var thisLine = line;
           
            if (parser) {
            
                 // 语法转换插件钩子
                code = parser(code);
                
            } else if (isDebug) {
            
                // 记录行号
                code = code.replace(/\n/g, function () {
                    line ++;
                    return '$line=' + line +  ';';
                });
                
            }
            
            
            // 输出语句. 转义: <%=value%> 不转义:<%==value%>
            if (code.indexOf('=') === 0) {

                var isEscape = code.indexOf('==') !== 0;

                code = code.replace(/^=*|[\s;]*$/g, '');

                if (isEscape && exports.isEscape) {

                    // 转义处理，但排除辅助方法
                    var name = code.replace(/\s*\([^\)]+\)/, '');
                    if (
                        !helpers.hasOwnProperty(name)
                        && !/^(include|print)$/.test(name)
                    ) {
                        code = '$escape($string(' + code + '))';
                    }

                } else {
                    code = '$string(' + code + ')';
                }
                

                code = replaces[1] + code + replaces[2];

            }
            
            if (isDebug) {
                code = '$line=' + thisLine + ';' + code;
            }
            
            getKey(code);
            
            return code + '\n';
        }
        
        
        // 提取模板中的变量名
        function getKey (code) {
            
            code = getVariable(code);
            
            // 分词
            forEach(code, function (name) {
             
                // 除重
                if (!uniq.hasOwnProperty(name)) {
                    setValue(name);
                    uniq[name] = true;
                }
                
            });
            
        }
        
        
        // 声明模板变量
        // 赋值优先级:
        // 内置特权方法(include, print) > 私有模板辅助方法 > 数据 > 公用模板辅助方法
        function setValue (name) {

            var value;

            if (name === 'print') {

                value = print;

            } else if (name === 'include') {
                
                prototype['$render'] = helpers['$render'];
                value = include;
                
            } else {

                value = '$data.' + name;

                if (helpers.hasOwnProperty(name)) {

                    prototype[name] = helpers[name];

                    if (name.indexOf('$') === 0) {
                        value = '$helpers.' + name;
                    } else {
                        value = value
                        + '===undefined?$helpers.' + name + ':' + value;
                    }
                }
                
                
            }
            
            variables += name + '=' + value + ',';
        }
        
        
    };
})();




})(template, this);


// RequireJS || SeaJS
if (typeof define === 'function') {
    define(function(require, exports, module) {
        module.exports = template; 
    });
// NodeJS
} else if (typeof exports !== 'undefined') {
    module.exports = template;
}



/*
jquery.extGrid.js
http://www.extgrid.com
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱
+-----------+
v1.0        |
			|
+-----------+
+-------------------------------------------+
v1.0.1        								|
修正 不同jquery版本出现的返回字符问题			|
+-------------------------------------------+
+--------------------------------------------------------+
v 1.2+       								   			 |
修正核心函数 提升数据展示速度，修正部分函数性能                 |
	1.新增 denyRowEvents : false,//禁止或使用自定义事件      |
	2.新增 onOverCell onOutCell                           |
+--------------------------------------------------------+
+--------------------------------------------------------+
v 1.2.1       								   			 |
1.新增 column中index 数据索引参数                    |
2.修正某些函数重复调用getColumns问题                         |
3.修正IE下刷新空白问题                                      |
4.修正v1.2版本_lSize没清0导致的BUG                          |
+--------------------------------------------------------+
+--------------------------------------------------------+
v 1.2.2      								   			 |
1.修正列锁情况下 Loading 出现的header问题            |
2.修正resize line 边框样式写死                        |
3.修正对数据排序后 出现的大小改变问题               |
+--------------------------------------------------------+
+-----------------------------------------------------------------------------------+
v 1.2.3	 									   			 							|
1.修正大数据下 导致深复制出现的问题												|
2.分页工具栏按钮优化																|
3.提高核心函数模板生成的性能													|
4.新增showHeader 开关 可控制是否显示header 对应的api: showHeader hideHeader		|
5.新增数据为空时 滚动条不出现问题（可选择性开启）								|
6.新增API updateGrid(data);  用户可自己设置显示数据 方便二次开发				|
7.新增参数emptyGridMsg 当grid数据为空是 显示在grid里的数据					|
8.showEmptyGridMsg:true 当设置为true emptyGridMsg则开启,否则关闭					|
	注:开启后 显示内容的宽度和gridHeader一样,也就是说超出宽度时会显示滚动条	|
9.修正showLoading时事件传递问题													|
10.提升分页栏性能																	|
+-----------------------------------------------------------------------------------+
+-----------------------------------------------------------------------------------+
v 1.2.4 									   			 							|
1.修改事件处理函数 																|
2.分页工具栏优化																	|
3.修正单元格事件返回false不阻止事件传递										|
4.新增事件 和修改部分事件名													|
5.新增 $.extGrid.puglins:[]插件队列，系统会调用里面的自定义插件函数			|
6.修正ajax 获取数据后调用不同的数据解析函数 eg jsonFilter						|
7.修正v1.2.3下分页工具栏出现js报错问题											|
8.修正列锁后被锁列事件缺失问题													|
9.新增触发单元格事件时检测当前对象是否单元格													|
10.新增API scrollToField,scrollToRow和配置参数 autoScrollToField/Row  |
+-----------------------------------------------------------------------------------+
*/

;(function($){
	"use strict";
	$.dataGrid = function(options){
		this.init(options);
	};
	$.extGrid = $.dataGrid;
	$.dataGrid.fn = {};
	$.dataGrid.fn.extend = function(obj){
		$.extend($.dataGrid.prototype,obj);
	};
	$.dataGrid.extend = function(obj){
		$.extend($.dataGrid,obj);	
	};
	$.dataGrid.extend({
		version : '1.2.4', 
		padding : 8,//单元格padding占用的宽度
		puglins : [],//调用插件初始化函数 参数 self
		getDefaults : function(opt){
			var _opt = {
				self : null,
				init : $.noop,//初始化调用
				title : '',//为空不显示标题
				iconCls : '',//datagrid 标题的icon样式
				toolBars : false,// [{'text':'添加',cls:'样式',callBack,disabled:false}]
				_toolItem : {text : '',cls : '',callBack : $.noop,disabled:false},//tool 属性
				ltText : '',//leftTopText
				rowNumbersWidth : false,//左侧数字列表 一般设为24px
				rowNumbersExpand: false,//默认是 i++
				rowNumbers2Row : true,//开启当rowNumbers2Row click的时候 选择当前行
				rowTpl : '',//grid 自定义行模板 可以是选择器 模版类型不能出现类似 abc<div>ef</div>a
				showHeader : true,//显示header
				headerTpl : '',//自定义 header 列模板 可以是选择器 模版类型不能出现类似 abc<div>ef</div>a
				containerCss : 'datagrid-container-border',
				border : true,
				leftBorder : 1, //gird边框大小 注意grid不会生成边框，而是根据你自己在css中定义的边框大小， 系统默认的是1px
				rightBorder : 1,
				topBorder : 1,
				bottomBorder : 1,
				padding : $.dataGrid.padding,
				width : 700,
				height : 250,
				checkBox : false,//是否显示checkbox列 开启后 ck 将是系统列
				checkBoxWidth : '20px',
				checkBoxTitle : '<input type="checkbox">',
				checkBoxFit : false,
				editColumn : false,//是否显示edit列 [{'text':'添加',cls:'样式',callBack,disabled:false}]  开启后 ed 将是系统列
				editColumnTitle : '操作',
				editColumnFit : true,
				editCellW : 60,//每个操作按钮的大小
				columns : [],//
				moveColumnTm : 500,//按下多少秒后开始移动列
				moveColumns : true,
				_columnMetaData : {
					field : '',
					index : '',//数据索引，默认==field
					title : '',
					width : '120px',//默认的列宽
					align : 'left',
					_expand : false,//自定义列内容
					callBack : $.noop,
					hcls : '',//header cell自定义css
					bcls : '',//body cell自定义css
					fcls : '',//footer cell自定义css
					sortable : false, 
					textLimit : false,//当处理大数据的时候 性能消耗比较厉害，
					fitColumn : true,
					disabled : false//当前列不可用
				},
				textLimit : false,//文字溢出总开关
				textLimitDef : '...',
				groupBy : false,//'year'  
				groupList : false,//['2012','2013','2014']
				groupListCallBack : $.noop,//group row的回调 
				_groupListData : [],//数据缓存
				autoScrollToField : true,
				autoScrollToRow : false,//原始true--张雷修改
				scrollbarSize : false,//获取滚动条大小
				sTop : 0,//初始滚动位置
				sLeft : 0,
				_lTime : 0,//v1.0旧 数据显示后 相隔这个时间继续显示下一个 废弃
				_lStart : 0,//采用预先加载的数据时 开始显示位置 eg offset _lStart limit _lSize
				_lSize : 0,//关闭分页显示 用于一页显示大数据时 采用一次性预先加载的数据
				fitColumns : true,//移动列总开关
				data : [],//列表数据 含有_expand的将作为扩展列 如果有 _openExpand=true 则会自动展开
				emptyGridMsg : '',//grid数据为空是的显示数据 可以是模板 opt 作为参数
				showEmptyGridMsg : true,
				pk : '',//主键名称
				lockRows : [],//已经锁定的行
				lockColumns : [],//已经锁定的列
				hideColumns : [],//已经隐藏的列
				selectRows : [],//已经选中的行
				isCreate : false,//废弃
				isShow : false,
				views : {},
				method : 'post',
				url : '',
				loadMsg : '加载中,请稍后...',
				cache : true,//缓存
				cacheData : [],
				pagination : false,//pager栏目
				pagerToolBar : false,//pager栏目 工具栏
				pagerMsg : '当前显示 {start} 到 {end} 条，共 {total} 条',
				pageNumber : 1,
				pageSize : 10,
				dataType : 'json',
				pageList : [10,20,30,40,50],
				queryParams : {},
				singleSelect : false,//是否可以多选
			//	selectOnCheck : true,
			//	checkOnSelect : true,
				sortName : '',
				sortOrder : 'asc',
				rowStyler : "",//行style 字符串作为 class function(rowid,rowdata)
				rowCallBack : $.noop,
				tpl : {},
				methodCall : {},//内部函数的回调函数
				template : template,//模板引擎对象
				isEscape : false,//是否开启模板转义
				noop : $.noop,
				denyRowEvents : false,//禁止触发的事件
				//fastest : false,//开启急速模式 该模式下 部分功能失效  待开启
				events : {
					onStart : $.noop,//创建开始 1
					onFinish : $.noop,//创建结束 1
					onBeforeLoad : $.noop,//调用远程数据开始 ，如果返回false讲取消本次请1求
					onLoadSuccess : $.noop,//调用远程数据成功1
					onLoadError : $.noop,//调用远程数据失败1
					onClickRow : $.noop,//当用户点击一行时触发1
					onColumnOver : $.noop,//当用户mouseover row
					onColumnOut : $.noop,//当用户mouseout row
					onOverCell : $.noop,//当用户mouseover cell
					onOutCell : $.noop,//当用户mouseout cell
					onOverRow : $.noop,//当用户mouseover row
					onOutRow : $.noop,//当用户mouseout row
					onDblClickRow : $.noop,//当用户双击一行时触发1
					onClickCell : $.noop,//当用户单击一个单元格时触发1
					onDblClickCell : $.noop,//当用户双击一个单元格时触发1
					onSortColumn : $.noop,//当用户对一列进行排序时触发1
					onResizeColumnStart : $.noop,//当用户调整列的尺寸时触发1
					onResizeColumn : $.noop,//当用户调整列的尺寸时触发1
					onResizeColumnStop : $.noop,//当用户调整列的尺寸时触发1
					onAfterResize : $.noop,//当用户调整列大小后触发,如果onResizeColumnStop 返回false 那么不会执行
					onSelect : $.noop,//用户选中一行时触发1
					onUnselect : $.noop,//当用户取消选择一行时触发1
					onSelectAll : $.noop,//当用户选中全部行时触发1
					onUnselectAll : $.noop,//当用户取消选中全部行时触发1
					onHeaderContextMenu : $.noop,//当 datagrid 的头部被右键单击时触发1
					onHeaderCreate : $.noop,//当 grid-header 创建完成时调用
					onToolBarCreate: $.noop,//排序触发1
					onRowContextMenu : $.noop,//当右键点击行时触发1
					onBeforeRefresh : $.noop,//1
					onRefresh : $.noop,//1
					onChangePageSize : $.noop,//1
					onShowGriding : $.noop,// grid数据显示中的时候调用
					onShowGrid : $.noop,// grid 每次刷新都会调用
					onBeforeShowGrid : $.noop, 
					onGetData : $.noop,//1 grid 数据变动都会调用
					onPagerCreate : $.noop,//1
					onSelectPage : $.noop,//1
					onClickRowNumber : $.noop,//1
					onSearch : $.noop,//1
					onExpandRow : $.noop,//1
					onLockColumn :  $.noop,//锁行事件 系统事件
					onBeforeLockColumn :  $.noop,//锁列结束
					onAfterLockColumn :  $.noop,//锁列结束
					onAfterUnLockColumn : $.noop,//锁列结束
					onLockRow : $.noop,//系统事件
					onBeforeLockRow : $.noop,//
					onAfterLockRow : $.noop,//锁行结束
					onAfterUnLockRow : $.noop,//锁行结束
					onBeforeUnlockColumn : $.noop,
					onBeforeUnlockRow : $.noop,
					onViewSizeChange : $.noop,
					onSizeChange : $.noop,
					onScroll : $.noop,
					onDataChange : $.noop,//数据有变更
					onCellEdit : $.noop,//单元格数据有变更调用
					onAdd : $.noop,//添加数据
					onUpdate : $.noop,//更新数据
					onDelete : $.noop,//删除数据
					onAjaxAdd : $.noop,//远程添加数据 需要自定义
					onAjaxUpdate : $.noop,//远程更新数据 需要自定义
					onAjaxDelete : $.noop,//远程删除数据 需要自定义
					onColumnMove : $.noop,
					onColumnMoving : $.noop
				}//事件组合 
				
			};
			return $.extend(_opt,opt);
		},
		//table转换成gird时的设置参数
		getToGridOptions : function(cfg){
			var opt = {
				options_from : 'data-options',
				columns_from : 'thead th',
				data_from : 'tbody tr'
			}
			return $.extend(true,opt,cfg);
		},
		_undef : function (val, defaultVal) {
			return val === undefined ? defaultVal : val;
		},
		_Tpl : {
			'container' : '<div class="datagrid-container <%=(border?containerCss:"")%>" id="<%=id%>" style=" position:relative; overflow:hidden; width:<%=width%>px; height:<%=height%>px;"></div>',
			'title' : '<div class="datagrid-title <%=iconCls%>" id="title_<%=id%>"><%=title%></div>',
			'toolbar' : '<div class="datagrid-toolbar" id="toolbar_<%=id%>"></div>',
			'grid' : '<div class="datagrid-view" id="view_<%=id%>" style="width:<%=width%>px; height:0px;"></div>',
			'group_row' : '<tr id="<%=id%>-group-row-<%=gid%>"  datagrid-group-row-id="<%=gid%>" class="datagrid-group-row"><td style="width:<%=w%>px" colspan="<%=colspan%>"><div  class="datagrid-group-cell"><%=html%>(<%=num%>)</div></td></tr>',
			'view1' : '<div class="datagrid-view1" id="view1_<%=id%>" style="width:<%=parseFloat(rowNumbersWidth)%>px;height:100%;">'
							+'<div  class="datagrid-header" id="view1-datagrid-header-<%=id%>" style="width: 100%; z-index:40; position:relative;">'
								+'<div class="datagrid-header-inner" id="view1-datagrid-header-inner-<%=id%>">'
									+'<div class="datagrid-header-inner-wraper" id="datagrid-view1-header-inner-wraper-<%=id%>">'
										+'<table class="datagrid-htable" id="view1-datagrid-header-inner-htable-<%=id%>" border="0" cellspacing="0" cellpadding="0">'
											+'<tbody id="view1-datagrid-header-inner-htable-tbody-<%=id%>">'
											+'</tbody>'
										+'</table>'
									+'</div>'
								+'</div>'
								+'<div class="datagrid-header-outer" id="view1-datagrid-header-outer-<%=id%>">'
									+'<div class="datagrid-header-outer-wraper" id="datagrid-view1-header-outer-wraper-<%=id%>">'
										+'<table class="datagrid-locktable" id="view1-datagrid-header-outer-locktable-<%=id%>" border="0" cellspacing="0" cellpadding="0">'
											+'<tbody id="view1-datagrid-header-outer-locktable-tbody-<%=id%>">'
											+'</tbody>'
										+'</table>'
									+'</div>'
								+'</div>'
							+'</div>'
							+'<div class="datagrid-body-wrap" id="view1-datagrid-body-wrap-<%=id%>" style="width: 100%; height:0px; overflow:hidden;zoom:1; ">'
								+'<div class="datagrid-body" id="view1-datagrid-body-<%=id%>" style="width: 100%;float:left;z-index:30;position:relative;">'
									+'<table class="datagrid-btable" id="view1-datagrid-body-btable-<%=id%>" cellspacing="0" cellpadding="0" border="0">'
										+'<tbody id="view1-datagrid-body-btable-tbody-<%=id%>">'
										+'</tbody>'
									+'</table>'
								+'</div>'
							+'</div>'
							+'<div class="datagrid-footer" id="view1-datagrid-footer-<%=id%>" style="width: 100%; height:0px; overflow:hidden;position:relative;z-index:31;"></div>'
						+'</div>',
			'view2' : '<div class="datagrid-view2" id="view2_<%=id%>" style="width:0px;height:100%;">'
							+'<div  class="datagrid-header" id="view2-datagrid-header-<%=id%>" style="width: 100%;">'
								+'<div class="datagrid-header-inner" id="view2-datagrid-header-inner-<%=id%>">'
									+'<div class="datagrid-header-inner-wraper" id="datagrid-view2-header-inner-wraper-<%=id%>">'
										+'<table class="datagrid-htable" id="view2-datagrid-header-inner-htable-<%=id%>" border="0" cellspacing="0" cellpadding="0">'
											+'<tbody id="view2-datagrid-header-inner-htable-tbody-<%=id%>">'
											+'</tbody>'
										+'</table>'
									+'</div>'
								+'</div>'
								+'<div class="datagrid-header-outer" id="view2-datagrid-header-outer-<%=id%>">'
									+'<div class="datagrid-header-outer-wraper" id="datagrid-view2-header-outer-wraper-<%=id%>">'
										+'<table class="datagrid-locktable" id="view2-datagrid-header-outer-locktable-<%=id%>" border="0" cellspacing="0" cellpadding="0">'
											+'<tbody id="view2-datagrid-header-outer-locktable-tbody-<%=id%>">'
											+'</tbody>'
										+'</table>'
									+'</div>'	
								+'</div>'
							+'</div>'
							+'<div class="datagrid-body" id="view2-datagrid-body-<%=id%>" style="width: 100%;height:0px;">'
								+'<table class="datagrid-btable" id="view2-datagrid-body-btable-<%=id%>" cellspacing="0" cellpadding="0" border="0">'
									+'<tbody id="view2-datagrid-body-btable-tbody-<%=id%>">'
									+'</tbody>'
								+'</table>'
							+'</div>'
							+'<div class="datagrid-footer" id="view2-datagrid-footer-<%=id%>" style="width: 100%; height:0px; overflow:hidden;"></div>'
					+'</div>',
			'pager' : '<div class="datagrid-pager pagination" id="<%=id%>_pager">'
						+' <table cellspacing="0" cellpadding="0" border="0">'
							+'<tbody>'
								+'<tr>'
									+'<td><select class="pagination-page-list">'
									+'<% var s = ""; for(var i=0;i<pageList.length;i++) {%>'
										+'<% if(pageList[i] == pageSize) {%>'
										+'<% s="selected";%>'
										+'<% } else {s="";} %>'
									+'<option value="<%=pageList[i]%>" <%=s%> ><%=pageList[i]%></option>'
									+'<% } %>'
									+'</select></td><td><div class="pagination-btn-separator"></div></td>'
									+'<td><a href="javascript:void(0)" class="pagination-first-btn p-plain <%=(pageNumber <= 1 )?"p-btn-disabled":""%>"><span class="pagination-first  p-btn">&nbsp;</span></a></td>'
									+'<td><a href="javascript:void(0)" class="pagination-prev-btn p-plain <%=(pageNumber <= 1 )?"p-btn-disabled":""%>"><span class="pagination-prev  p-btn">&nbsp;</span></a></td>'
									+'<td><div class="pagination-btn-separator"></div></td>'
									+'<td><span style="padding-left:6px;">第</span></td>'
									+'<td><input class="pagination-num" type="text" value="<%=pageNumber%>" size="2"></td>'
									+'<td><span style="padding-right:6px;">页 共 <%=pages%> 页</span></td>'
									+'<td><div class="pagination-btn-separator"></div></td>'
									+'<td><a href="javascript:void(0)" class="pagination-next-btn p-plain <%=(pageNumber >= pages)?"p-btn-disabled":""%>"><span class="pagination-next p-btn">&nbsp;</span></a></td>'
									+'<td><a href="javascript:void(0)" class="pagination-last-btn p-plain <%=(pageNumber >= pages)?"p-btn-disabled":""%>"><span class="pagination-last p-btn ">&nbsp;</span></a></td>'
									+'<td><div class="pagination-btn-separator"></div></td>'
									+'<td><a href="javascript:void(0)" class="pagination-load-btn p-plain"><span class="pagination-load p-btn">&nbsp;</span></a></td>'
									+'<td id="pagination-toolbar-<%=id%>"></td>'
								+'</tr>'
							+'</tbody>'
						+'</table>'
						+'<div class="pagination-info"><%=pagerMsg%></div>'
						+'<div style="clear:both;"></div>'
					+'</div>',
			'view1_header_inner_row' : '<tr class="datagrid-header-row">'
											+'<td align="center" class="datagrid-td-rownumber" style=""><div class="datagrid-header-rownumber" style="width:<%=parseFloat(rowNumbersWidth)%>px;"><%=ltText%></div></td>'
									   +'</tr>',	
			'view1_header_outer_row' : '',	
			'view2_header_inner_row' : '<tr class="datagrid-header-row">'
											+'<% for(var i in fields) {%>'
											+'<td field="<%=fields[i]["field"]%>" align="<%=fields[i]["align"]%>">'
												+'<div class="datagrid-header-wrap" field="<%=fields[i]["field"]%>" >'
													+'<div class="datagrid-cell <%=fields[i]["hcls"]%>"  style="width:<%=fields[i]["width"]%>">'
														+'<span><%=fields[i]["title"]%></span>'
														+'<span class="datagrid-sort-icon">&nbsp;</span>'
													+'</div>'
												+'</div>'
											+'</td>'
											+'<% } %>'
										+'</tr>',
			'view2_header_outer_row' : '',
			'view1_row' : '',//改用模版函数代替
			'view2_row' : ''//改用模版函数代替
		}
		
	});
	$.dataGrid.fn.extend({
		init : function(options) {
			var self = this;
			
			self.initEvents(options);//初始化用户自定义事件
			
			self.configs = 	$.extend({},$.dataGrid.getDefaults(),options);
			var opt = self.configs;
			opt.self = self;



			
			//模版引擎设置
			opt.template.isEscape = opt.isEscape;
			opt.template.helper('parseInt', parseInt);
			opt.template.helper('parseFloat', parseFloat);
			
			//默认datagrid有边框 如果从css中去掉边框样式，可以去掉下面的2像素只差
			if( opt.border ) {
				opt.width -= (opt.leftBorder + opt.rightBorder);
				opt.height -= (opt.topBorder + opt.bottomBorder);
			}
			opt.id = opt.id || self.getId();
			opt.gid = opt.gid || "#view_"+opt.id;
			opt.rowNumbersWidth = (parseFloat(opt.rowNumbersWidth)>=0) ? opt.rowNumbersWidth : false;
			if( opt.rowNumbersWidth===false ) {
				opt.rowNumbersWidth = (opt.groupBy==false) ? false : '0px';
			}
			if( opt.rowNumbersWidth===false ) {
				opt.rowNumbersWidth = !opt.lockColumns.length ? false : '0px';
			}
			//cell中padding 的大小
			for(var he in opt.columns) {
				if(opt.columns[he]['width']) {
					opt.columns[he]['width'] = parseFloat( opt.columns[he]['width'] ) - opt.padding;
				}	
			}
			//系统初始化调用
			opt.init.call(self,opt);
			
			//系统事件绑定
			self.sysEvents();
			
			//e.onStart.call(self);
			self.fireEvent("onStart",self,[opt]);
			
			self.setContainer() //setContainer必须
				.setTitle()
				.setToolBar()
				.setGrid()
				.setPager(true)
				.show();
			
		},
		inArray : function(elem,arr){
			if ( arr ) {
				var len = arr.length;
				var i = 0;
				for ( ; i < len; i++ ) {
					// Skip accessing in sparse arrays
					if ( i in arr && arr[ i ] == elem ) {
						return i;
					}
				}
			}
			return -1;
		},
		//tpl修正
		//用户自定义模版级别最高,其次模板函数,最后_Tpl中的模版
		tpl : function(tpl,data){
			var self = this;
			var opt = self.configs;
			if( typeof tpl == 'undefined' ) tpl = "";
			if( typeof data == 'undefined' ) data = {};
			
			var _tpl_ = {};
			if( typeof opt.cacheData['_tpl_'] == 'undefined' ) {
				opt.cacheData['_tpl_'] = {};
				_tpl_ = opt.cacheData['_tpl_'];
			} else {
				_tpl_ = opt.cacheData['_tpl_'];
			}
			
			template.isEscape = opt.isEscape;
			
			var html = "";
			if( tpl in opt.tpl && opt.tpl[tpl] ) {
				if( opt.tpl[tpl] in _tpl_ ) {
					var render = _tpl_[ opt.tpl[tpl] ];
					html = render(data);
				} else {
					var render = opt.template.compile( opt.tpl[tpl] );
					
					_tpl_[ opt.tpl[tpl] ] = render;
					
					html = render(data);		
				}
			} else if( tpl in self ) {
				html = self[tpl](data);
			} else if( tpl in $.dataGrid._Tpl && $.dataGrid._Tpl[tpl] ) {
				if( $.dataGrid._Tpl[tpl] in _tpl_ ) {
					var render = _tpl_[ $.dataGrid._Tpl[tpl] ];
					html = render(data);
				} else {
					var render = opt.template.compile( $.dataGrid._Tpl[tpl] );
					
					_tpl_[ $.dataGrid._Tpl[tpl] ] = render;
					
					html = render(data);		
				}
			} else {
				if( tpl.toString() in _tpl_ ) {
					var render = _tpl_[ tpl.toString() ];
					html = render(data);
				} else {
					var render = opt.template.compile( tpl.toString() );
					
					_tpl_[ tpl.toString() ] = render;
					
					html = render(data);		
				}
			}
			return html;
		},
		//添加事件
		bind : function(eventType,func,scope){
			if( typeof eventType == "undefined" ) {
				return this;	
			}
			var func = func || $.noop;
			var self = this;
			var event = self.configs.events;
			
			event[eventType] = $.dataGrid._undef(event[eventType],[]);
			
			if( $.isFunction( event[eventType] ) ) {
				event[eventType] = [];
			}
			
			var _e = {
					scope : !!scope ? scope : self,
					func : func
				};
			
			var id = event[eventType].push(_e);
		
			return id-1;
		},
		unbind : function(eventType,id){
			var self = this;
			var event = self.configs.events;
			var id = $.dataGrid._undef(id,false);
			if(id === false) {
				event[eventType] = $.noop;
			} else {
				event[eventType][id] = $.noop;
			}
			return self;
		},
		//有改动，目前scope 没有作用，为了兼容调用该函数时，请随便为scpoe设置值
		fireEvent : function(eventType,scope,data){
			var self = this;
			var events = self.configs.events[eventType];
			var scope = $.dataGrid._undef(scope,self);
			var data = $.dataGrid._undef(data,[]);
			var r = true;
			if($.isArray(events) ) {
				
				for(var i=0;i<events.length;i++) {
					var _e = events[i];
					if( $.isPlainObject( _e ) ) {
						r = _e.func.apply(_e.scope,data);
						if(r === false) break;	
					} else if( $.isFunction( _e ) ){
						r = _e.apply(self,data);
						if(r === false) break;	
					}
				}	
				
			} else if($.isFunction(events)) {
				r = events.apply(self,data);
			}
			return r;
		},
		loadPuglins : function(){
			var self = this;
			$.each( $.dataGrid.puglins,function(i){
				if( $.isFunction( this ) )
					this.call(self);									
			} );
		},
		initEvents : function(opt){
			var self = this;
			var e = opt.events ? opt.events : {};
			if( $.isPlainObject(e) && !$.isEmptyObject(e) ) {
				for(var i in e){
					if( $.isFunction(e[i]) && e[i] !== $.noop ) {
						e[i] = [ e[i] ];	
					}	
				}
			}
		},
		sysEvents : function(){
			var self = this;
			var opt = self.configs;
			//自动展示_expand
			self.bind("onShowGrid",self.autoExpand);
			//单击展示_expand
			self.bind("onClickRow",self.setExpandEvent);
			//绑定checkBox
			self.bind("onUnselectAll",function(){this.checkCk(false)});
			self.bind("onSelectAll",function(){this.checkCk(true)});
			self.bind("onUnselect",function(){this.checkCk(false)});
			self.bind("onShowGrid",function(){this.checkCk(false)});
			//系统事件
			self.bind("onLoadSuccess",self.onLoadSuccess);//ajax数据成功返回后的操作
			self.bind("onLoadError",self.onLoadError);//ajax数据返回错误后的操作
			self.bind("onSetPk",self.setPk);
			self.bind("onViewSizeChange",self.onViewSizeChange);
			self.bind("onSizeChange",self.onSizeChange);
			self.bind("onShowGrid",self.resetHeader);
			self.bind("onShowGrid",self.onLockRow);
			self.bind("onShowGrid",self.onLockColumn);
			self.bind("onScroll",self.onScroll);
			self.bind("onAfterLockRow",self.onAfterLockRow);
			self.bind("onAfterLockColumn",self.onAfterLockColumn);
			self.bind("onDataChange",self.onDataChange);
			self.bind("onOverRow",self.onOverRow);
			self.bind("onOutRow",self.onOutRow);
			self.bind("onShowGrid",self.onDisplayField);
			self.bind("onViewSizeChange",self.isEmptyGrid);
			self.bind("onHeaderCreate",self.onHeaderCreate);
			self.bind("onColumnMove",self.onColumnMove);
			self.bind("onFinish",self.loadPuglins);
			//本地操作时开启 记录选择的行 尚未去实现 可通过二次开发实现
			self.bind("onSelect",self.addSelectRecode);
			self.bind("onUnselect",self.removeSelectRecode);
		},
		getId : function(){
			return 'datagrid_' + Math.floor(Math.random() * 99999);	
			//return 'extgrid_' + Math.floor(Math.random() * 99999);	
		},
		unique : function(){
			return 'unique_' + Math.floor(Math.random() * 99999);		
		},
		showLoading : function(msg,render){
			var self = this;	
			var opt = self.configs;
			var msg = typeof msg === 'undefined' ? opt.loadMsg : msg;
			var render = "#"+opt.id;
			//self.hideLoading(render);
			var isExists = $("#"+opt.id+"_datagrid-mask-wraper");
			if( isExists.length ) {
				isExists.show();	
				return self;
			}
			
			var maskWraper = $('<div id="'+opt.id+'_datagrid-mask-wraper" class="datagrid-mask-wraper"><div id="'+opt.id+'_datagrid-mask" class="datagrid-mask"></div><div id="'+opt.id+'_datagrid-mask-spacer" class="datagrid-mask-spacer"></div><div id="'+opt.id+'_datagrid-mask-msg" class="datagrid-mask-msg" style=" left: 50%;">'+msg+'</div><div>');
			$(render).append(maskWraper);
			var maskMsg = $("#"+opt.id+"_datagrid-mask-msg");
			var w = maskMsg.outerWidth(true);
			maskMsg.css("marginLeft",-w/2+"px");
			maskWraper.click(function(e){
					e.stopPropagation();
					e.preventDefault();											 
				});
			return self;
		},
		hideLoading : function(render){
			var self = this;
			var opt = self.configs;
			setTimeout(function(){
				$("#"+opt.id+"_datagrid-mask-wraper").hide();					
			},0);
			
			return self;
		},
		methodCall : function(method){
			var method = method || "";
			var self = this;
			var opt = self.configs;
			if( method!="" && method in opt.methodCall && $.isFunction(opt.methodCall[method]) ) {
				opt.methodCall[method].call(self);	
			}
			
			return self;
		},
		//设置后会立刻刷新表格
		getColumnData : function(columnName,proto,value){
			var self = this;
			var opt = self.configs;
			
			var columnName = $.dataGrid._undef(columnName,false);	
			var proto = $.dataGrid._undef(proto,false);	
			
			if(columnName === false ) return self;
			
			//var fields = self.getColumns(true);//获取columns元数据 ？？ 想不起为啥以前要获取元数据了
			var fields = opt.columns;
			
			for(var i in fields) {
				if(fields[i]['field'] == columnName) {
					if(proto === false) {
						return fields[i];
					} else {
						if(typeof value === 'undefined') {
							return fields[i][proto];
						} else {
							fields[i][proto] = value;
							
							opt.columns = fields;//设置后必须调用getColumns 。setGridHeader会调用getColumns
							
							self.setGridHeader();//重新生成
							self.refreshDataCache();
							return self;
						}
					}
				}	
			}
			return null;
		},
		setColumnData : function(columnName,proto,value){
			var self = this;
			return self.getColumnData(columnName,proto,value);
		},
		getData : function(){
			var self = this;
			var opt = self.configs;
			var async = self.getAsync();
			if( async ) {
				return opt.cacheData['source'];
			} else {
				return opt.data;
			}
		},
		textLimit : function(text,width,fontSize) {
			var self = this;
			var opt = self.configs;
			var text = $.dataGrid._undef(text,"");
			if(text == "") return text;
			text = new String(text);
			var _t = $("<div style='position:absolute;left:-1000px;'></div>");
			_t.appendTo(document.body);
			_t.css({'fontSize':fontSize});
			
			var len = text.length;
			var _text = "";
			var _i = 0;
			for(var i=1;i<=len;i++) {
				_text = text.substr(0,i);
				_t.html( _text + opt.textLimitDef );
				if( parseFloat(_t.width()) < parseFloat(width) ) {
					_i = i;
				} else {
					break;	
				}
			}
			
			_t.remove();
			
			if(_i == 0) {
				text = text.substr(0,1) + opt.textLimitDef;
			} else if(_i == len) {
				text = text;	
			} else {
				text = text.substr(0,_i) + opt.textLimitDef;
			}
			return text.toString();
		},
		getTpl : function(tpl) { //兼容函数
			return tpl;
		},
		setContainer : function(opt) {
			var opt = opt || {};
			var self = this;
			//var opt = $.extend({},self.configs,opt);
			var opt = self.configs;
			var tpl = self.tpl("container",opt);
			opt.helper.html(tpl);
			return self;
		},
		setTitle : function(title) {
			var self = this;
			var opt = self.configs;
			opt.title = typeof title === 'undefined' ?  opt.title : title;
			if(opt.title=="") return self;
			var tpl = self.tpl("title",opt);
			self.configs.views['title'] = $(tpl);
			return self;
		},
		getTools : function(items){
			var self = this;
			var opt = self.configs;
			
			
			if( $.isPlainObject(items) ) {
				var items = [ items ];	
			}
			if( !$.isArray(items) && !$.isPlainObject(items) ) {
				return $(items);	
			}
			var _item = opt._toolItem;
			var container = '<table cellspacing="0" cellpadding="0" border="0"><tbody><tr>{$tools}</tr></tbody></table>';
			var h = '';
			for(var i in items) {
				if( $.isPlainObject(items[i]) ) {
					items[i] = $.extend({},_item,items[i]);
					if(items[i]['cls'] != '') {
						items[i]['cls'] += " l-btn-icon-left";		
					}
					var isDisabled = items[i]['disabled'] ? "l-btn-disabled" : "";
					h += '<td><a href="javascript:void(0)" class="l-btn l-btn-plain '+isDisabled+'" indexid="'+i+'"><span class="l-btn-left"><span class="l-btn-text '+items[i]['cls']+'">'+items[i]['text']+'</span></span></a></td>';
				} else if( items[i]=='|' || items[i]=='-' || items[i]==';' || items[i]==',' ) {
					h += '<td><div class="datagrid-btn-separator"></div></td>';	
				} else {
					h += '<td>'+items[i]+'</td>';		
				}
			}
			container = container.replace('{$tools}',h);
			var container = $(container);
			container.find(".l-btn").each(function(i){
				$(this).click(function(e){
					var indexid = $(this).attr("indexid");
					items[indexid]['callBack'].call(self,this,items[indexid]);
					e.stopPropagation();
					e.preventDefault();
				});									   
			});
			return container;
		},
		setToolBar : function() {
			var self = this;
			var opt = self.configs;
			if(opt.toolBars===false) return self;
			var tpl = self.tpl("toolbar",opt);
			self.configs.views['toolbar'] = $(tpl);
			var tool = self.getTools(opt.toolBars);
			if( tool !== false ) {
				self.configs.views['toolbar'].append(tool);	
			}
			self.fireEvent('onToolBarCreate',self,[self.configs.views['toolbar'],opt.toolBars]);
			
			self.methodCall('setToolBar');
			
			return self;
		},
		setGrid : function () {
			
			var self = this;
			var opt = self.configs;
			var views = opt.views;
			if(!views['grid']) {
				var tpl = self.tpl("grid",opt);
				self.configs.views['grid'] = $(tpl);
			} else {//设置高度
				var grid = views['grid'];
				var h = 0;
				for(var i in views) {
					if(i == 'grid') continue;
					h += views[i].outerHeight(true);
				}
				grid.height(opt.height - h);
			}
			self.methodCall('setGrid');
			
			
			return self;
		},
		//当数据中包含 expand openExpand=true的时候调用
		autoExpand : function(){
			var self = this;
			var opt = self.configs;
			
			for(var i in opt.data) {
				if( $.isPlainObject(opt.data[i]) && ('_expand' in opt.data[i]) && ('_openExpand' in opt.data[i]) && opt.data[i]['_openExpand'] ) {
					self.expandRow(i,opt.data[i]['_expand']);
				}
			}
		},
		checkCk : function(type){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var render = gid;
			var type = $.dataGrid._undef(type,false);
			//view2-datagrid-header-inner-htable-tbody-datagrid_57036
			$("#view2-datagrid-header-inner-htable-tbody-"+opt.id).find(">.datagrid-header-row td[field='ck']").find("input:checkbox").each(function(i){
				this.checked = type ? true : false;																					   
			});
		},
		setExpandEvent : function(t,rowId,rowData){
			var self = this;
			var opt = self.configs;
			
			if( !$.isPlainObject(rowData) ) {
				return;	
			}
			
			if('_expand' in rowData) {
				if( !self.isExpandRowShow(rowId) )
					self.expandRow(rowId,rowData['_expand']);	
				else 
					self.hideExpandRow(rowId);	
			}
		},
		getScrollbarSize: function () {
			var self = this,
				opt = self.configs;
            if (!opt.scrollbarSize) {
                var db = document.body,
                    div = document.createElement('div');

                div.style.width = div.style.height = '100px';
                div.style.overflow = 'scroll';
                div.style.position = 'absolute';

                db.appendChild(div); 

                
                opt.scrollbarSize = {
                    width: div.offsetWidth - div.clientWidth,//竖
                    height: div.offsetHeight - div.clientHeight//横
                };

                db.removeChild(div);
            }

            return opt.scrollbarSize;
        },
		scrollToField : function(field){
			var self = this;
			var opt = self.configs;
			var header = $("#view2-datagrid-header-"+opt.id);
			
			if( !header.length ) {
				return self;	
			}
			
			var columns = self.getColumnList();
			
			if( self.inArray( field,columns ) == -1 ) {
				return self;		
			}
			//检测当前列是否被锁定
			if( self.inArray( field,opt.lockColumns ) != -1 ) {
				return self;		
			}
			//检测当前列是否已经隐藏
			if( self.inArray( field,opt.hideColumns ) != -1 ) {
				return self;		
			}
			
			var scrollbarSize = self.getScrollbarSize();
			
			var offset = header.offset();
			var w = header.outerWidth();
			w -= scrollbarSize.width;//-滚动条大小
			
			var f = $(">tr.datagrid-header-row td[field='"+field+"']","#view2-datagrid-header-inner-htable-tbody-"+opt.id);
			
			if( !f.length ) return self;
			
			var fo = f.offset();
			var fw = f.outerWidth();
			
			var outerWidth = 0;
			if( offset.left > fo.left ) {
				outerWidth = offset.left - fo.left;
			} else if( (offset.left+w) < (fo.left+fw) ) {
				outerWidth = (offset.left+w) - (fo.left+fw);
			}
			var sLeft = 0;
			
			sLeft = opt.sLeft - outerWidth;
			
			opt.sLeft = sLeft;
			
			self.fireEvent("onScroll",self,[true]);
			return self;
		},
		scrollToRow : function(rid){
			var self = this;
			var opt = self.configs;
			
			var body = $("#view2-datagrid-body-"+opt.id);
			
			if( !body.length ) {
				return self;	
			}
			
			//检测当前行是否被锁定
			if( self.inArray( rid,opt.lockRows ) != -1 ) {
				return self;		
			}
			
			var scrollbarSize = self.getScrollbarSize();
			
			var offset = body.offset();
			var h = body.outerHeight();
			h -= scrollbarSize.height;//-滚动条大小
			
			var f = $("#"+opt.id+"-row-"+rid);
			if( !f.length ) {
				return self;	
			}
			
			var fo = f.offset();
			var fh = f.outerHeight();
			
			var outerHeight = 0;
			if( offset.top > fo.top ) {
				outerHeight = offset.top - fo.top;
			} else if( (offset.top+h) < (fo.top+fh) ) {
				outerHeight = (offset.top+h) - (fo.top+fh);
			}
			
			var sTop = 0;
			
			sTop = opt.sTop - outerHeight;
			
			opt.sTop = sTop;
			
			self.fireEvent("onScroll",self,[true]);
			
			return self;
		},
		addPagerEvent : function(){
			var self = this;
			var opt = self.configs;
			var obj = opt.views['pager'];
			//var e = opt.events;
			obj.find("a.pagination-first-btn").click(function(){
				if($(this).hasClass("p-btn-disabled")) return;
				opt.pageNumber = 1;
				self.refreshData();	
			});
			obj.find("a.pagination-prev-btn").click(function(){
				if($(this).hasClass("p-btn-disabled")) return;
				var pageNumber = opt.pageNumber - 1;
				opt.pageNumber = pageNumber<=0 ? 1 : pageNumber;										
				self.refreshData();											 
			});
			obj.find("a.pagination-next-btn").click(function(){
				if($(this).hasClass("p-btn-disabled")) return;																				
				var total = opt.total || opt.data.length;
				var pages = Math.ceil( parseInt(total)/parseInt(opt.pageSize) );
				var pageNumber = opt.pageNumber + 1;
				opt.pageNumber = pageNumber>pages ? pages : pageNumber;	
				self.refreshData();	
			});
			obj.find("a.pagination-last-btn").click(function(){
				if($(this).hasClass("p-btn-disabled")) return;
				var total = opt.total || opt.data.length;
				var pages = Math.ceil( parseInt(total)/parseInt(opt.pageSize) );
				opt.pageNumber = pages;
				self.refreshData();	
			});
			obj.find("a.pagination-load-btn").click(function(){
				if($(this).hasClass("p-btn-disabled")) return;
				self.refreshData();											 
			});
			obj.find(".pagination-page-list").change(function(){
				var total = opt.total || opt.data.length;
				var pageSize = $(this).val();
				var pages = Math.ceil( parseInt(total)/parseInt(pageSize) );
				
				if( opt.pageNumber>pages ) {
					opt.pageNumber = pages;		
				}
				
				//var r = e.onChangePageSize.call(self,pageSize);
				var r = self.fireEvent('onChangePageSize',self,[pageSize]);
				
				if(r === false) return false;
				opt.pageSize = pageSize;
				//var r = e.onSelectPage.call(self,pageSize);
				var r = self.fireEvent('onSelectPage',self,[pageSize]);
				if(r === false) return false;
				self.refreshData();	
			});
			obj.find(".pagination-num").keydown(function(e){
				if(e.keyCode === 13) {
					opt.pageNumber = obj.find(".pagination-num").val();	
					self.refreshData();	
				}
			});
			return self;
		},
		setPager : function(init) {
			
			
			var self = this;
			var opt = self.configs;
			var init = $.dataGrid._undef(init,false);
			if( !opt.pagination ) return self;
			//计算分页
			var data = {};
			data.id = opt.id;
			data.total = opt.total || opt.data.length;
			data.pageSize = opt.pageSize;
			data.pageNumber = opt.pageNumber;
			data.pageList = opt.pageList;
			data.pages = Math.ceil( parseInt(data.total)/parseInt(data.pageSize) );
			//检查pageNumber的合法性
			opt.pageNumber = opt.pageNumber > data.pages ? data.pages : opt.pageNumber;
			opt.pageNumber = opt.pageNumber<=0 ? 1 : opt.pageNumber;
			data.pageNumber = opt.pageNumber;
			
			data.start = (data.pageNumber*data.pageSize - data.pageSize + 1)<0 ? 0 : (data.pageNumber*data.pageSize - data.pageSize + 1);
			data.end = data.pageNumber*data.pageSize;
			
			data.pagerMsg = opt.pagerMsg.replace("{start}",data.start).replace("{end}",data.end).replace("{total}",data.total);

			var _pager = $("#"+opt.id+"_pager");

			var tpl = self.tpl("pager",data);
			
			if(!_pager.size()) {
				opt.views['pager'] = $(tpl);
			} else {
				opt.views['pager'] = $(tpl);
			//	$("#"+opt.id).find(">.datagrid-pager").replaceWith(tpl);
			//	opt.views['pager'] = $("#"+opt.id).find(">.datagrid-pager");
				_pager.after( opt.views['pager'] );
				_pager.remove();
			}
			
			//是否初始化
			if(init) {
				return self;	
			}
			
			
			
			self.addPagerEvent();
			
			if( $.isArray( opt.pagerToolBar ) && opt.pagerToolBar.length ) {
				$("#pagination-toolbar-"+opt.id).append( self.getTools( opt.pagerToolBar ) );
			}
			
			self.fireEvent("onPagerCreate",self,[opt.views['pager']]);
			
			self.methodCall('setPager');
			
			
			
			return self;	
		},
		//datagrid的大小改变时 触发
		onSizeChange : function(width,height){
			var self = this;
			var opt = self.configs;
			opt.width = $.dataGrid._undef(width,opt.width);
			opt.height = $.dataGrid._undef(height,opt.height);
			
			//默认datagrid有边框 如果从css中去掉边框样式，可以去掉下面的2像素只差
			if( opt.border ) {
				opt.width -= (opt.leftBorder + opt.rightBorder);
				opt.height -= (opt.topBorder + opt.bottomBorder);
			}
			$("#"+opt.id).css({
				width : opt.width,
				height : opt.height
			});
			$("#view_"+opt.id).css({
				width : opt.width
			});
			
			//self.setGrid(); //计算grid高度
			
			//计算grid高度
			var views = opt.views;
			var grid = views['grid'];
			var h = 0;
			for(var i in views) {
				if(i == 'grid') continue;
				h += views[i].outerHeight(true);
			}
			grid.height(opt.height - h);
			
			self.fireEvent("onViewSizeChange",self,[]);
		},
		//view的大小改变时 触发
		onViewSizeChange : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var w = $(gid).width(),
				h = $(gid).height();
			
			//var view1 = $(gid).find(".datagrid-view1");
			//var view2 = $(gid).find(".datagrid-view2");
			var view1 = $("#view1_"+opt.id);
			var view2 = $("#view2_"+opt.id);
			
			//设置宽度	
			//var view1_w = $(gid).find(".datagrid-view1 .datagrid-header .datagrid-htable").outerWidth();
			var view1_w = $("#view1-datagrid-header-inner-htable-"+opt.id).outerWidth();
			
			view1.width(view1_w);
			view2.width(w - parseFloat( view1_w ) );
			//设置高度
			//var view2_header_h = view2.find(".datagrid-header-inner .datagrid-header-inner-wraper .datagrid-htable").outerHeight();
			var view2_header_h = $("#view2-datagrid-header-inner-htable-"+opt.id).outerHeight();
			//左右高度一样
			$("#view1-datagrid-header-inner-htable-"+opt.id).height( view2_header_h );
			//设置 datagrid-header-inner
			view2_header_h = parseFloat(view2_header_h) - 1;
			
			//隐藏header
			if( !opt.showHeader ) {
				view2_header_h = 0;	
			}
			
			//$(gid).find(".datagrid-header .datagrid-header-inner").height( view2_header_h );
			$("#view1-datagrid-header-inner-"+opt.id).height( view2_header_h );
			$("#view2-datagrid-header-inner-"+opt.id).height( view2_header_h );
			
			//设置datagrid-header-outer
			//var view2_header_outer_h = view2.find(".datagrid-header .datagrid-header-outer .datagrid-locktable").outerHeight();
			var view2_header_outer_h = $("#view2-datagrid-header-outer-locktable-"+opt.id).outerHeight();
			//$(gid).find(".datagrid-header .datagrid-header-outer").height( view2_header_outer_h );
			$("#view1-datagrid-header-outer-"+opt.id).height( view2_header_outer_h );
			$("#view2-datagrid-header-outer-"+opt.id).height( view2_header_outer_h );
			//设置datagrid-header
			//var header_h = parseFloat( view2.find(".datagrid-header .datagrid-header-outer").outerHeight() ) + parseFloat( view2.find(".datagrid-header .datagrid-header-inner").outerHeight() );
			var header_h = parseFloat( $("#view2-datagrid-header-inner-"+opt.id).outerHeight() ) + parseFloat( $("#view2-datagrid-header-outer-"+opt.id).outerHeight() );
			
			$("#view1-datagrid-header-"+opt.id).height( header_h );
			$("#view2-datagrid-header-"+opt.id).height( header_h );
			
			var bodyH = view2.height() - opt.gheader.height() - opt.gfooter.height();
			
			opt.gbody.height( bodyH );
			$("#view1-datagrid-body-wrap-"+opt.id).height( bodyH );
			
			//触发滚动
			self.fireEvent("onScroll",self,[]);
		},
		//数组移动算法
		// pos 要移动的元素
		array_sort : function(iarr,pos,target,t) {//t 代表是前还是后 1 代表前 0 代表后

			if(pos == target) return iarr;
			//支持字符下标
			var _iarr = iarr;
			iarr = [];
			for(var j in _iarr) {
				var _i = iarr.push(j);
				if( j == pos) {
					pos = _i-1;
				} else if( j == target ) {
					target = _i-1;
				}
			}
			//core
			var _p = iarr[pos];//记录元副本
			if( pos>target ) {
				if(!t) {
					target++;
				}
				for(var i=pos;i>=0;i--) {
					if(i == target) {
						iarr[i] = _p;
						break;
					}
					iarr[i] = iarr[i-1];
				}
			} else if( pos<target ) {
				if(t) {
					target--;
				}
				for(var i=pos;i<=target;i++) {
					
					if( i == target ) {
						iarr[i] = _p;
					} else {
						iarr[i] = iarr[i+1];
					}	
				}
			}
			//字符下标
			var new_arr = [];
			for( var k in iarr ) {
				new_arr.push( _iarr[ iarr[k] ] );
			}
			iarr = new_arr;
			return iarr;
		},
		onColumnMove : function(opt){
			var self = this,
				opt = self.configs;
			var fields = opt.columns;
			var pos = 0;
			var target = 0;
			var t = opt.moveToFieldPos;
			if( opt.moveField == opt.moveToField ) return;
			if( self.inArray( opt.moveField,opt.lockColumns )!= -1 ) return;
			if( self.inArray( opt.moveToField,opt.lockColumns )!= -1 ) return;
			for(var i in fields) {
				if( fields[i]['field'] == opt.moveField ) {
					pos  = i;	
				}
				if( fields[i]['field'] == opt.moveToField ) {
					target  = i;	
				}
			}
			//移动列
			fields = opt.columns =self.array_sort(fields,pos,target,t);
			
			//移动单元格数据
			if( t ) {//移动到目标元素前
				var pos = $("#view2-datagrid-header-inner-htable-tbody-"+opt.id).find("td[field='"+opt.moveField+"']");
				var target = $("#view2-datagrid-header-inner-htable-tbody-"+opt.id).find("td[field='"+opt.moveToField+"']");
				target.before( pos );
				
				for(var j in opt.data) {
					pos = $("#"+opt.id+"-row-"+j).find("td[field='"+opt.moveField+"']");
					target = $("#"+opt.id+"-row-"+j).find("td[field='"+opt.moveToField+"']");	
					target.before( pos );
				}
				
			} else {//移动到目标元素后
				var pos = $("#view2-datagrid-header-inner-htable-tbody-"+opt.id).find("td[field='"+opt.moveField+"']");
				var target = $("#view2-datagrid-header-inner-htable-tbody-"+opt.id).find("td[field='"+opt.moveToField+"']");
				target.after( pos );
				
				for(var j in opt.data) {
					pos = $("#"+opt.id+"-row-"+j).find("td[field='"+opt.moveField+"']");
					target = $("#"+opt.id+"-row-"+j).find("td[field='"+opt.moveToField+"']");	
					target.after( pos );
				}
			}
		},
		setView : function(){
			var self = this,
				opt = self.configs,
				tpl_view1 = self.tpl(self.getTpl("view1"),opt),
				tpl_view2 = self.tpl(self.getTpl("view2"),opt),
				gid = opt.gid;
				$(gid).html('');//防止重复调用
				$(tpl_view1).appendTo(gid);
				$(tpl_view2).appendTo(gid);
				opt.gheader = $("#view2-datagrid-header-"+opt.id);
				opt.gbody = $("#view2-datagrid-body-"+opt.id);
				opt.gfooter = $("#view2-datagrid-footer-"+opt.id);
				
				// 滚动条事件绑定
				opt.gbody.scroll(function(){
					self.fireEvent('onScroll',self,[]);
				});
				//var w = $(tpl_view1).appendTo(gid).width();
				//$(tpl_view2).appendTo(gid).width( $(gid).width() - w );//此处可不计算宽度
		},
		getRowData : function (rid,isPK){
			var self = this;
			var opt = self.configs;
			
			var isPK = $.dataGrid._undef(isPK,false);
			
			var data = isPK ? self.getData() : opt.data;
			
			
			if(!isPK) {
				return data[rid];
			} else {
				var pk = opt.pk;
				for(var i in data) {
					if(data[i][pk] == rid) {
						return data[i];
					}	
				}
			}
			return false;
		},
		//直接操作 data 数据
		setRowData : function (rid,field,value){
			var self = this,
				opt = self.configs;	
			var data = opt.data;
			
			data[rid][field] = value;
			//同时修改元数据
			var _d = false;
			
			if( typeof data[rid]['pk'] != "undefined" ) {
				_d = self.getRowData( data[rid]['pk'],true);
				if( _d )
					_d[field] = value;
			}
			
			return self;
		},
		//获取当前Field 和 data数据的真实索引
		getRealField : function(field){
			var self = this,
				opt = self.configs;	
			if( typeof field == 'undefined' ) {
				return null;	
			}
			var _field = field;
			var field = self.getColumnData(field,'index');
				field = field=="" ? _field : field;
				return field;
		},
		//不要直接用 rowData[rid][field] 获取数据 而应该用getFieldValue
		getFieldValue : function (rid,field){
			var self = this,
				opt = self.configs;	
				
			field = self.getRealField(field);
			
			var data = this.getRowData(rid);
			
			return data[field];
		},
		setFieldValue : function(rid,field,value){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			
			var _field = self.getRealField(field);//
			
			var rowData = self.getRowData(rid);
			//判断是否内容是否改动
			if( rowData[_field]== value ) {
				return false;	
			}
			
			var rows = "#"+opt.id+"-row-"+rid+",#"+opt.id+"-view1-row-"+rid;
			//opt.gbody.find("tr.datagrid-row[datagrid-row-index='"+rid+"']").find("td[field='"+field+"']").find("div.datagrid-cell").html(value);
			var t = $(rows).find("td[field='"+field+"'] div.datagrid-cell");
			t.html(value)
			 .addClass("datagrid-cell-edit");
			 
			//getColumnData
			var callBack = self.getColumnData(field,"callBack");
			if( callBack!=null && $.isFunction(callBack) &&  callBack != opt.noop) {
				callBack.call(self,t,rid,field,rowData);	//field['callBack'].call(self,t,rowId,field,rowData)
			}
			
			self.setRowData(rid,_field,value);
			self.fireEvent('onCellEdit',self,[t,rid,field,rowData]);
			return rowData;
		},
		// @d true 返回data数据 false返回数组的索引
		getSlectRows : function( d ){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var list = [];
			
			var d = $.dataGrid._undef(d,false);
			
			$("#view2_"+opt.id).find("tr.datagrid-row[datagrid-row-select='1']").each(function(idx){
				list.push($(this).attr("datagrid-row-index"));																		 
			});
			
			/*for(var j in opt.data) {
				var isSelect = $("#"+opt.id+"-row-"+j).attr("datagrid-row-select");
				if(isSelect == 1)
					list.push( isSelect );		
			}*/
			var _list = [];
			if( d ) {
				for(var j=0;j<list.length;j++)	{
					_list.push( opt.data[ list[j] ] );	
				}
				return _list;
			} 
			return list;
		},
		//行列锁
		onLockRow : function(){
			var self = this,
				opt = self.configs;
			var rows = opt.lockRows;
			for(var i in rows) {
				if(rows[i] == null) continue;
				self.lockRow(rows[i]);
			}	
		},
		onAfterLockRow : function(rowId){
			var self = this,
				opt = self.configs;
			
			//self.hideExpandRow(indexid);
			var d_ = self.getRowData(rowId);
			if( $("#"+opt.id+"-expand-row-"+rowId).size() ) {
				var isHidden = $("#"+opt.id+"-expand-row-"+rowId).is(":hidden");
				self.expandRow(rowId,d_['_expand']);
				if( isHidden ) {
					self.hideExpandRow(rowId);
				}
			}
			//修正：当分组开启时 行解锁后不会自动回到分组里
			if( opt.groupBy ) {
				//view2
				var bdy = $("#view2-datagrid-body-btable-tbody-"+opt.id);
				bdy.find("tr.datagrid-group-row").each(function(i){
					var groupId = $(this).attr("datagrid-group-row-id");
					var f = bdy.find("tr[datagrid-group-id='"+groupId+"']").first();
					$(this).insertBefore(f);
				});
				//view1
				var bdy2 = $("#view1-datagrid-body-btable-tbody-"+opt.id);
				bdy2.find("tr.datagrid-group-row-view1").each(function(i){
					var groupId = $(this).attr("datagrid-group-row-id");
					var f = bdy2.find("tr[datagrid-group-id='"+groupId+"']").first();
					$(this).insertBefore(f);
				});
			}
			//取消锁定时位置的时刻刷
			self.changeExpandPos();
 		},
		onLockColumn : function(){
			var self = this,
				opt = self.configs;
			var columns = opt.lockColumns;
			for(var i in columns) {
				self.lockColumn(columns[i]);
			}	
		},
		onAfterLockColumn : function(field){
			var self = this,
				opt = self.configs;
			var gid = opt.gid;
			//expand事件 重新创建left row的td
			$("#view2_"+opt.id).find("tr.datagrid-row-expand").each(function(i){
				var indexid = $(this).attr("datagrid-expand-row-index");
				var isHidden = $(this).is(":hidden");
				//self.hideExpandRow(indexid);
				var d_ = self.getRowData(indexid);
				if( $("#"+opt.id+"-expand-row-"+indexid).size() ) {
					self.expandRow(indexid,d_['_expand']);
					if( isHidden ) {
						self.hideExpandRow(indexid);
					}
				}
			});
			//取消锁定时位置的时刻刷新
			//self.changeExpandPos();
			//锁定列是 修改expandRow的大小
			self.setExpandRowSize();
			//group 事件
			self.addGroupRow();
		},
		lockRow : function(rowId){
			var self = this,
				opt = self.configs;
			if( self._lockRow(rowId) ) {
				if( self.inArray(rowId,opt.lockRows) == -1 )
					opt.lockRows.push(rowId);
					
				self.fireEvent('onAfterLockRow',self,[rowId]);
			  	self.fireEvent('onViewSizeChange',self,[]);
			}
		},
		unLockRow : function(rowId){
			var self = this,
				opt = self.configs;
			if( self._unLockRow(rowId) ) {
				for(var i in opt.lockRows) {
					if(opt.lockRows[i] == rowId) {
						opt.lockRows[i] = null;
					}	
				}
				//取消null
				var _c = [];
				for(var j in opt.lockRows) {
					if( opt.lockRows[j] !== null ) {
						_c.push( opt.lockRows[j] );	
					}	
				}
				opt.lockRows = _c;
				
				self.onAfterLockRow(rowId);//主要是调用该函数
				self.fireEvent('onAfterUnLockRow',self,[rowId]);
				self.fireEvent('onViewSizeChange',self,[]);
			}
		},
		unLockColumn : function(field){
			var self = this,
				opt = self.configs;
			if( self._unLockColumn(field) ) {
				for(var i in opt.lockColumns) {
					if(opt.lockColumns[i] == field) {
						opt.lockColumns[i] = null;
					}	
				}
				//取消null
				var _c = [];
				for(var j in opt.lockColumns) {
					if( opt.lockColumns[j] !== null ) {
						_c.push( opt.lockColumns[j] );	
					}	
				}
				opt.lockColumns = _c;
				
				self.onAfterLockColumn(field);//主要是调用该函数
				self.fireEvent('onAfterUnLockColumn',self,[field]);
				self.fireEvent('onViewSizeChange',self,[]);
			}
		},
		lockColumn : function(field){
			var self = this,
				opt = self.configs;
			if( self._lockColumn(field) ) {
				if(self.inArray(field,opt.lockColumns)  == -1 )
					opt.lockColumns.push(field);
					
				self.fireEvent('onAfterLockColumn',self,[field]);
				self.fireEvent('onViewSizeChange',self,[]);
			}
		},
		_lockRow : function(rowId) {
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var render = gid;
			
			var r = self.fireEvent('onBeforeLockRow',self,[rowId]);
			if(r === false) return false;
			
			var f = $("#"+opt.id+"-row-"+rowId);
			var f1 = $("#"+opt.id+"-view1-row-"+rowId);
			if( !f.length ) return false; // || f.parents(".datagrid-header").length
			//防止重复锁定 注：不可以开启，否则刷新表格收不会锁行
			//if( self.inArray( rowId,opt.lockRows ) != -1 ) return false;
			
			//移动行
			//view2.find(".datagrid-header .datagrid-header-outer .datagrid-locktable > tbody").first().append(f);
			$("#view2-datagrid-header-outer-locktable-tbody-"+opt.id).append(f);
			//view1.find(".datagrid-header .datagrid-header-outer .datagrid-locktable > tbody").first().append(f1);
			$("#view1-datagrid-header-outer-locktable-tbody-"+opt.id).append(f1);
			
			return true;
		},
		_unLockRow : function(rowId){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var render = gid;
			
			var r = self.fireEvent('onBeforeUnlockRow',self,[rowId]);

			if(r === false) return false;
			
			var f = $("#"+opt.id+"-row-"+rowId);
			var f1 = $("#"+opt.id+"-view1-row-"+rowId);
			if( !f.length ) return false; // || f.parents(".datagrid-header").length
			//判断当前行是否已经锁定
			if( self.inArray( rowId,opt.lockRows ) == -1 ) return false;
			//console.log("unlock start");
			//修正当上一个元素也锁定的时 找出下一个没有锁定的元素
			//修正所有都锁定的时候 无法取消锁定问题
			var data = opt.data;
			//往上找
			for(var m=rowId-1;m>=-1;m--) {
				if( self.inArray( m,opt.lockRows ) == -1 ) {
					
					break;
				}
			}
			rowId = m;
			
			//移动行
			if(rowId>=0) {
				//rowId -= 1;
				f.insertAfter("#"+opt.id+"-row-"+rowId);
				f1.insertAfter("#"+opt.id+"-view1-row-"+rowId);
			} else {
				//view2.find(".datagrid-body .datagrid-btable > tbody").first().prepend(f);
				$("#view2-datagrid-body-btable-tbody-"+opt.id).prepend(f);
				//view1.find(".datagrid-body .datagrid-btable > tbody").first().prepend(f1);	
				$("#view1-datagrid-body-btable-tbody-"+opt.id).prepend(f1);
			}
			
			return true;	
		},
		_getRowNumber : function(rowId) {
			var self = this,
				opt = self.configs,
				data = opt.data,
				gid = opt.gid;
			var view1_tr = $("#"+opt.id+"-view1-row-"+rowId);
			var isNew = false;
			if( !view1_tr.size() ) {//添加行
				isNew = true;
				var view1_row = self.getTpl("view1_row");
				_d = {
					i : rowId,
					id : opt.id,
					rowNumbersExpand : opt.rowNumbersExpand ? opt.rowNumbersExpand : false,
					data : data[rowId],
					groupBy : opt.groupBy,
					rowNumbersWidth : opt.rowNumbersWidth,
					opt : opt
				};
				var ltr = $( self.tpl(view1_row,_d) );
				self.bindRowEvent(false,ltr);
				view1_tr = ltr;

			}
			return {
					isNew : isNew,
					node : view1_tr
				};
		},
		_lockColumn : function(field) {
			var self = this,
				opt = self.configs,
				data = opt.data,
				gid = opt.gid;
			var render = gid;
			
			//如果rowNumbersWidth == false 则不能进行列锁
			if( opt.rowNumbersWidth===false ) { 
				return false;
			}
			
			var r = self.fireEvent('onBeforeLockColumn',self,[field]);
			if(r === false) return false;
			
			var fields = self.getColumnList();
			var field = $.isArray(field) ? field : [field];
			
			var view1_header_hbody_id = "#view1-datagrid-header-inner-htable-tbody-"+opt.id;
			var view1_header_lockbody_id = "#view1-datagrid-header-outer-locktable-tbody-"+opt.id;
			//移动列
			for(var i in field) {
				if(field[i] == null) continue;	
				if( self.inArray( field[i],fields ) == -1 ) continue;
				//防止重复锁定 注：不可以开启，否则刷新表格收不会锁行
				//if( self.inArray( field[i],opt.lockColumns ) != -1 ) continue;
				
				var f = $("#view2-datagrid-header-inner-htable-tbody-"+opt.id).find(">tr.datagrid-header-row td[field='"+field[i]+"']");
				
				$(view1_header_hbody_id).find(">tr.datagrid-header-row").append(f);
				
				$("#view2-datagrid-header-outer-locktable-tbody-"+opt.id).find(">tr.datagrid-row td[field='"+field[i]+"']").each(function(i){
					var rowId = $(this).parent().attr("datagrid-row-index");
					var getRn = self._getRowNumber(rowId);
					if( getRn.isNew ) {
						$("#view1-datagrid-header-outer-locktable-tbody-"+opt.id).append(getRn.node);
					}
					$(this).appendTo( getRn.node );
				});
				
				$("#view2-datagrid-body-btable-tbody-"+opt.id).find(">tr.datagrid-row td[field='"+field[i]+"']").each(function(i){
					var rowId = $(this).parent().attr("datagrid-row-index");
					var getRn = self._getRowNumber(rowId);
					if( getRn.isNew ) {
						$("#view1-datagrid-body-btable-tbody-"+opt.id).append(getRn.node);
					}
					$(this).appendTo( getRn.node );
				});
				
				$("#view2-datagrid-footer-btable-tbody-"+opt.id).find(">tr.datagrid-footer-row td[field='"+field[i]+"']").each(function(i){
					var rowId = $(this).parent().attr("datagrid-row-index");
					var getRn = self._getRowNumber(rowId);
					if( getRn.isNew ) {
						$("#view1-datagrid-footer-btable-tbody-"+opt.id).append(getRn.node);
					}
					$(this).appendTo( getRn.node );
				});
			}
			
			return true;
		},
		_unLockColumn : function(field) {
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var render = gid;
			
			var r = self.fireEvent('onBeforeUnlockColumn',self,[field]);
			if(r === false) return false;
			
			var fields = self.getColumns();
			var isField = false;
			for(var i in fields) {
				if(fields[i]['field'] == field) {
					isField = true;
					break;
				}
			}
			if( !isField ) return false;
			//判断当前列是否已经不存在锁定
			if( self.inArray( field,opt.lockColumns ) == -1 ) return false;
			
			//var f = $(render).find(".datagrid-header tr.datagrid-header-row td[field='"+field+"']");
			var f = $("#view1-datagrid-header-inner-htable-tbody-"+opt.id).find(">tr.datagrid-header-row td[field='"+field+"']");
			
			var view = $(gid);
			//var view1 = $(render).find(".datagrid-view1");
			//var view2 = $(render).find(".datagrid-view2");
			var view1 = $("#view1_"+opt.id);
			var view2 = $("#view2_"+opt.id);
			
			//移动field 列 到 view1
			var pos = i;
			//修正所有都锁定的时候 无法取消锁定问题
			for(var m in fields) {
				if( fields[m]['field'] == field ) break;	
			}
			for(m=m-1;m>=-1;m--) {
				if(m<0) break;
				var _field = fields[m]['field'];
				if( self.inArray( _field,opt.lockColumns ) == -1 ) {
					break;
				}
			}
			pos = m;
			//pos = pos < 0 ? 0 : pos;
			
			if( pos < 0) {
				f.prependTo( $("#view2-datagrid-header-inner-htable-tbody-"+opt.id).find(">tr.datagrid-header-row") );
			} else {
				f.insertAfter( $("#view2-datagrid-header-inner-htable-tbody-"+opt.id).find(">tr.datagrid-header-row").find("td[field]").eq(pos) );	
			}
			//移动单元格
			$("#view1-datagrid-header-outer-locktable-tbody-"+opt.id).find(">tr.datagrid-row td[field='"+field+"']").each(function(i){
				var tr = $(this).parent();
				var rowId = tr.attr("datagrid-row-index");
				//$(this).appendTo( view.find("#"+opt.id+"-row-"+indexid) );
				var view2_tr = $("#"+opt.id+"-row-"+rowId);
				if( pos < 0) {
					view2_tr.prepend( $(this) );
				} else {
					view2_tr.find(">td").eq(pos).after( $(this) );	
				}
				
			});
			$("#view1-datagrid-body-btable-tbody-"+opt.id).find(">tr.datagrid-row td[field='"+field+"']").each(function(i){
				var tr = $(this).parent();
				var rowId = tr.attr("datagrid-row-index");
				//$(this).appendTo( view.find("#"+opt.id+"-row-"+indexid) );
				var view2_tr = $("#"+opt.id+"-row-"+rowId);
				if( pos < 0) {
					view2_tr.prepend( $(this) );
				} else {
					view2_tr.find(">td").eq(pos).after( $(this) );	
				}
				
			});
			
			$("#view1-datagrid-footer-btable-tbody-"+opt.id).find(">tr.datagrid-row td[field='"+field+"']").each(function(i){
				var tr = $(this).parent();
				var rowId = tr.attr("datagrid-row-index");
				//$(this).appendTo( view.find("#"+opt.id+"-row-"+indexid) );
				var view2_tr = $("#"+opt.id+"-row-"+rowId);
				if( pos < 0) {
					view2_tr.prepend( $(this) );
				} else {
					view2_tr.find(">td").eq(pos).after( $(this) );	
				}
			});
			
			//self.onAfterLockColumn(field);
			
			return true;	
		},
		
		getCheckBoxColumn : function(columns) {
			var self = this,
			opt = self.configs;
			var r = $.extend({},opt._columnMetaData);
			
			/*for(var i in columns) {
				if(columns[i]['field'] == 'ck')	return false;
			}*/
			
			r.field = 'ck';
			r.title = opt.checkBoxTitle;
			r._expand = '<input type="checkbox">';
			r.hcls = 'datagrid-header-check';
			r.bcls = 'datagrid-cell-check';
			r.width = opt.checkBoxWidth;
			r.fitColumn = opt.checkBoxFit;
			r.align = 'center';
			r.callBack = function(t,rowId,field,rowData){
				var self = this;
				$(t).find("input:checkbox").click(function(e){
					if( this.checked ) {
						self.selectRow(rowId);	
					} else {
						self.unselectRow(rowId);
					}
					e.stopPropagation();
				});
			};
			return r;
		},
		geteditColumn : function(columns) {
			var self = this,
			opt = self.configs;
			var r = $.extend({},opt._columnMetaData);
			var j = 0;
			var k = 0;
			if( $.isArray(opt.editColumn) ) { 
				$.each(opt.editColumn,function(i,n){
					if( $.isPlainObject(this) ) {
						opt.editColumn[i] = $.extend({},opt._toolItem,opt.editColumn[i]);
						j++;	
					} else {
						k++;	
					}						   
				});
			} else {
				opt.editColumn = [];
			}
			/*for(var i in columns) {
				if(columns[i]['field'] == 'ed')	return false;
			}*/
			var str = '';
			r.field = 'ed';
			r.title = (opt.editColumnTitle == '' || opt.editColumnTitle === false ) ? ' ' : opt.editColumnTitle;
			r._expand = str;
			r.hcls = 'datagrid-header-edit';
			r.bcls = 'datagrid-cell-edit';
			r.width = ( j * opt.editCellW + k * 4 )+'px';
			r.fitColumn = opt.editColumnFit;
			r.align = 'center';
			r.callBack = function(t,rowId,field,rowData){
				var self = this;
				var _item = opt._toolItem;
				var tools = [];
				var tool = {};
				for(var i in opt.editColumn) {
					
					if( $.isPlainObject(opt.editColumn[i]) ) {
						tool = $.extend(true,{},_item,opt.editColumn[i]);
						tool.callBack = function(t,_item_){
							var indexid = $(t).attr("indexid");
							opt.editColumn[indexid]['callBack'].call(self,t,rowId,field,rowData,_item_);	
						}
						
						tools.push(tool);	
					}  else {
						tools.push(opt.editColumn[i]);	
					}
				};
				
				var _tool = self.getTools(tools);
				t.append(_tool);
			}
			
			return r;
		},
		getColumns : function(s){
			var self = this,
			opt = self.configs,
			columns = opt.columns;
			var s = $.dataGrid._undef(s,false);
			//初始调用时保存副本
			opt.cacheData['columns'] = $.dataGrid._undef(opt.cacheData['columns'],columns);//cacheData
			//获取副本
			if(s) {
				return 	opt.cacheData['columns'];
			}
			
			//检测是否设置了 列 否则用data的key作为列名
			if(columns.length<=0) {
				if(opt.data.length>0) {
					
					if( $.isPlainObject( opt.data[0] ) ) {
					
						for(var i in opt.data[0]) {
							columns.push({'field':i});
						}
					
					}
				}
			}
			var _columns = [];
			var _hasSetCk = false,
				_hasSetEd = false;
			for(var i in columns) {
				
				columns[i] = $.extend({},opt._columnMetaData,columns[i]);
				
				if( columns[i]['disabled'] === true ) continue;
				
				if(typeof columns[i]['width'] == 'number') columns[i]['width'] += 'px';
				columns[i]['title'] = columns[i]['title'] == "" ?  columns[i]['field'] : columns[i]['title'];
				columns[i]['index'] = columns[i]['index'] == "" ?  columns[i]['field'] : columns[i]['index'];
				
				//判断是否开启ck ed字段
				if( opt.checkBox !== false && columns[i]['field']=="ck" && _hasSetCk===false ) {
					columns[i] = self.getCheckBoxColumn(columns);
					_hasSetCk = true;
				}
				if( opt.editColumn !== false  && columns[i]['field']=="ed" && _hasSetEd===false ) {
					columns[i] = self.geteditColumn(columns);
					_hasSetEd = true;
				}
				
				_columns.push(columns[i]);
			}
			
			opt.columns = columns = _columns;
			
			//检测是否使用checkbox
			var ck = [],
				ed = [];
			if( opt.checkBox !== false && _hasSetCk===false ) {
				if(self.getCheckBoxColumn(columns) !== false) {
					ck = [ self.getCheckBoxColumn(columns) ];
					$.merge(ck,columns);
					columns = ck;
				}
			}
			if( opt.editColumn !== false && _hasSetEd===false) {
				if(self.geteditColumn(columns) !== false) {
					ed = [ self.geteditColumn(columns) ];
					$.merge(columns,ed);
				}
			}
			opt.columns = columns;
			return opt.columns;
		},
		getColumnList : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var fields = opt.columns;
			var list = [];
			for(var i in fields) {
				list.push(fields[i]['field']);	
			}
			return list;
		},
		
		//页面刷新的时候调用
		onDisplayField : function(){
			var self = this,
				opt = self.configs,
				_columns = opt.hideColumns,
				gid = opt.gid;
				
			if(_columns.length <= 0) return;
			
			for(var i in _columns) {
				if( _columns[i] == null ) continue;
				self.hideColumn(_columns[i]);
			}
		},
		
		displayColumn : function( field , type ) {
			var self = this,
				opt = self.configs,
				_columns = opt.hideColumns,
				gid = opt.gid;
			var fields = self.getColumnList();

			
			if( self.inArray(field,fields) == -1 ) return false;
			
			var isDisplay = (type == "show") ? true : false;
			if( isDisplay  ) { //&& self.inArray( field,_columns )
				for(var i in _columns) {
					if(_columns[i] == field) _columns[i] = null;
				}
			} else {
				if( self.inArray( field,_columns ) == -1 )
					_columns.push( field );
			}
			$(gid).find("td[field='"+field+"']")[type]();
			self.fireEvent("onViewSizeChange",self);
			
			self.setGroupRowSize();
			self.setExpandRowSize();
			
			return true;
		},
		showColumn : function( field ){
			var self = this;
			return self.displayColumn( field ,"show");
		},
		hideColumn : function( field ){
			var self = this;
			return self.displayColumn( field , "hide");
		},
		sortColumn : function(field){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var field = field || false;
			if(field == false) return;
			var render = '#view2-datagrid-header-inner-htable-tbody-'+opt.id;
			$(render).find("td[field='"+field+"']")
					 .find("div.datagrid-cell")
					 .click(function(e){
						
						var field = $(this).parent().attr('field');
						opt.sortName = field;
						 var rs = self.fireEvent("onSortColumn",self,[field]);//opt.events.onSortColumn.call(self,field);
						 if(rs === false) return;
						 if( $(this).hasClass('datagrid-sort-asc') ) {
							 $(render).find("div.datagrid-cell").removeClass('datagrid-sort-asc').removeClass('datagrid-sort-desc');
							$(this).removeClass('datagrid-sort-asc');
							$(this).addClass('datagrid-sort-desc');
							opt.sortOrder = 'desc';
						 } else {
							  $(render).find("div.datagrid-cell").removeClass('datagrid-sort-asc').removeClass('datagrid-sort-desc');
							$(this).removeClass('datagrid-sort-desc');
							$(this).addClass('datagrid-sort-asc');	 
							opt.sortOrder = 'asc';
						 };
						 
						 self.refreshData();
					 });
		},
		showHeader : function(){
			var self = this,
				opt = self.configs;
				opt.showHeader = true;
			self.fireEvent('onViewSizeChange',self,[]);
		},
		hideHeader : function(){
			var self = this,
				opt = self.configs;
				opt.showHeader = false;
			self.fireEvent('onViewSizeChange',self,[]);
		},
		setGridHeaderEvent : function(tr,ltr){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
				
			var fields = opt.columns;	
			//设置列 是否可以改变大小 参数
			if(opt.fitColumns) {
				var o = $.extend({},opt);
				o.self = self;
				o.stop = function(e,cfg){
					//var r = opt.events.onResizeColumnStop();
					var r = self.fireEvent('onResizeColumnStop',self,[cfg]);
					if(r === false) return r;
					self.cStop(cfg);
				};
				
			}
			
			
			var tds = tr.find("td[field]").each(function(){
				
				var field = $(this).attr("field");
				
				//设置列是否可改变大小
				if(opt.fitColumns) {
					var fitColumn = self.getColumnData(field,'fitColumn');
					if( fitColumn ) {
						$("div.datagrid-cell",this)._resize(o);
						
					}	
				}	
				
				//设置列是否可排序
				var sortable = self.getColumnData(field,'sortable');
				if( sortable ) {
					self.sortColumn(field);	
				} else {
					$("div.datagrid-cell >.datagrid-sort-icon",this).hide();	
					
				}
				//设置默认排序列
				if( opt.sortName && opt.sortName == field ) {
					$("div.datagrid-cell",this).addClass('datagrid-sort-'+opt.sortOrder.toLowerCase());	
				}
			
			});
			
			//拖动列
			if( opt.moveColumns ) {
				tds.moveColumn(opt);//tr.find("td[field]").moveColumn(opt)
			}
			
			tds.bind("click",function(e){
									  
				var field = $(this).attr("field");
				if( opt.autoScrollToField ) {
					self.scrollToField(field);	
				}
				
			});
			
			//设置鼠标移动效果
			tds.hover(function(e){//tr.find(">td,td[field]").
				$(this).addClass("datagrid-header-over");
				self.fireEvent("onColumnOver",self,[this,e]);
			},function(e){
				$(this).removeClass("datagrid-header-over");
				self.fireEvent("onColumnOut",self,[this,e]);
			});
			
			//设置contentmenu
			tr.bind("contextmenu",function(ev){
				//触发单击行事件
				//var r = opt.events.onHeaderContextMenu.call(this);
				var r = self.fireEvent('onHeaderContextMenu',self,[this,ev]);
				if(r == false) return false;
			});
			
			/*检查文字是否超出边界*/
			self.setGridHeaderTextLimit();
			
			/*checkbox绑定*/
			if(opt.checkBox) {
				var cks = tr.find("td[field='ck']");
				cks.find(".datagrid-sort-icon").hide();
				cks.find("input:checkbox").click(function(){
						if(opt.singleSelect) {
							this.checked = false;
							return false;
						}
						if(this.checked) {
							self.selectAllRows();
						} else {
							self.unselectAllRows();
						}
					});
			}
			
		},
		/*检查文字是否超出边界*/
		setGridHeaderTextLimit : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var render = gid;
			
			if(!opt.textLimit) 
				return false;
			
			var fields = opt.columns;	
			
			for(var i in fields) {
				if(fields[i]['textLimit'] === false) continue;
				var f = $(render).find(".datagrid-header-row td[field='"+fields[i]['field']+"']").find("div.datagrid-cell");
				var w = f.width(); // 注意 此处的width 包含了sort 图标,如果需要精确 那么就要减掉 sort-icon 大概12px
				var fs = f.css("fontSize");
				var text = self.getColumnData( fields[i]['field'],'title' );
				text = self.textLimit( text , w , fs );
				f.find("span").first().html( text );
			}	
		},
		setGridHeader : function(){
			
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var fields = self.getColumns();
			
			var view1_header_row = self.getTpl("view1_header_inner_row");
			var view2_header_row = opt.headerTpl ? opt.headerTpl : self.getTpl("view2_header_inner_row");
			
			var $view2_header_inner_wraper = $("#datagrid-view2-header-inner-wraper-"+opt.id);
			var $view1_header_inner_wraper = $("#datagrid-view1-header-inner-wraper-"+opt.id);
			var $view2_header_outer_wraper = $("#datagrid-view2-header-outer-wraper-"+opt.id);
			var $view1_header_outer_wraper = $("#datagrid-view1-header-outer-wraper-"+opt.id);
			
			//datagrid-header-inner-wraper
			var view1_header_inner_wraper = ['<table class="datagrid-htable" id="view1-datagrid-header-inner-htable-'+opt.id+'" border="0" cellspacing="0" cellpadding="0"><tbody id="view1-datagrid-header-inner-htable-tbody-'+opt.id+'">'];
			var view2_header_inner_wraper = ['<table class="datagrid-htable" id="view2-datagrid-header-inner-htable-'+opt.id+'" border="0" cellspacing="0" cellpadding="0"><tbody id="view2-datagrid-header-inner-htable-tbody-'+opt.id+'">'];
			//datagrid-header-outer-wraper
			var view1_header_outer_wraper = ['<table class="datagrid-locktable" id="view1-datagrid-header-outer-locktable-'+opt.id+'" border="0" cellspacing="0" cellpadding="0"><tbody id="view1-datagrid-header-outer-locktable-tbody-'+opt.id+'"></tbody></table>'];
			var view2_header_outer_wraper = ['<table class="datagrid-locktable" id="view2-datagrid-header-outer-locktable-'+opt.id+'" border="0" cellspacing="0" cellpadding="0"><tbody id="view2-datagrid-header-outer-locktable-tbody-'+opt.id+'"></tbody></table>'];
			
			var ltr = self.tpl(view1_header_row,opt);
			var tr = self.tpl(view2_header_row,{'fields':fields,opt:opt});
			
			view1_header_inner_wraper.push(ltr);
			view2_header_inner_wraper.push(tr);
			
			view1_header_inner_wraper.push('</tbody></table>');
			view2_header_inner_wraper.push('</tbody></table>');
			
			$view1_header_inner_wraper.html( view1_header_inner_wraper.join("") );
			$view2_header_inner_wraper.html( view2_header_inner_wraper.join("") );
			$view1_header_outer_wraper.html( view1_header_outer_wraper.join("") );
			$view2_header_outer_wraper.html( view2_header_outer_wraper.join("") );
			
			self.fireEvent('onHeaderCreate',self,[]);
			
			ltr = $("> tr.datagrid-header-row",'#view1-datagrid-header-inner-htable-tbody-'+opt.id);
			tr = $("> tr.datagrid-header-row",'#view2-datagrid-header-inner-htable-tbody-'+opt.id);
			
			self.setGridHeaderEvent(tr,ltr);
			
			self.methodCall('setGridHeader');
			
			return true;
		},
		onHeaderCreate : function(){
			
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			if( !opt.headerTpl ) return -1;
			var fields = opt.columns;	
			var headerBody = $("#view2-datagrid-header-inner-htable-tbody-"+opt.id);
			var _columns = [];
			var _thex = $.dataGrid.getToGridOptions();
			headerBody.find(">tr td[field],>tr th[field],>tr td["+_thex.options_from+"],>tr th["+_thex.options_from+"]").each(function(i){
				var field = $(this).attr("field");
				var _d = $(this).attr(_thex.options_from);
				if( _d ) {
					_d = eval("({"+_d+"})")	
				} else {
					_d = {};	
				}
				if(!field) {
					field = _d.field ?  _d.field : 'field_'+(Math.random() * 99999);
				}
				
				var _d2 = {};
				_d2.title = $(this).html();
				
				var _d3 = {};
				for(var j in fields) {
					if( fields[j]['field'] == field ) {
						_d3 = fields[j];
						break;
					}
				}
				if( $.isEmptyObject( _d3 ) ) {
					_d3.field = field;
				}
				
				_d.width = _d.width ? _d.width : $(this).width();
				_d.width -= opt.padding;
				
				var _d4 = $.extend(true,{},_d,_d2,_d3);
				
				_d4.align = _d4.align ? _d4.align : ($(this).attr("align") ? $(this).attr("align") : opt._columnMetaData.align);
				_d4.hcls = _d4.hcls ? _d4.hcls : opt._columnMetaData.hcls;
				
				var $this = this;
				
				if( $(this).is("th") ) {
					$this = $('<td field="'+_d4.field+'" align="'+_d4.align+'"></td>');
					$(this).replaceWith($this);
				} else {
					$(this).attr("field",_d4.field);
					$(this).attr("align",_d4.align);
				}
				
				$($this).html('<div class="datagrid-header-wrap" field="'+_d4.field+'"><div class="datagrid-cell '+_d4.hcls+'" style="width:'+parseFloat(_d4.width)+'px"><span>'+_d4.title+'</span><span class="datagrid-sort-icon">&nbsp;</span></div></div>');
				
				_columns.push(_d4);
				
			});
			opt.columns = _columns;
			//添加系统必要的参数
			headerBody.find(">tr").addClass('datagrid-header-row');
			
			
			
			return headerBody.find(">tr");
		},
		//设置field的属性 但不更新表格 注意:setColumnData 会立刻更新表格
		setColumnValue : function(field,key,value){
			var self = this;
			var fields = self.getColumns();
			for(var i in fields){
				if(fields[i]['field'] == field) {
					fields[i][key] = value;
					continue;
				}	
			}
		},
		cStop : function(cfg){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var glist = $(gid).find("td[field='"+cfg.field+"']").find("div.datagrid-cell");
			
			if(!glist.size()) return;
			
			var w = parseFloat(glist.width());
			
			w = w + cfg.offsetX;
			w = w<10 ? 10 : w;
			
			//把configs的width设置回去
			self.setColumnValue(cfg.field,'width',w);
			
			glist.width(w);
			//数据更新后滚动条位置重置
			//opt.gbody.scrollLeft(opt.sLeft);
			//opt.gbody.scrollTop(opt.sTop);
			//opt.gbody.scroll();
			self.fireEvent('onScroll',self,[true]);
			
			/*检查文字是否超出边界*/
			self.setGridHeaderTextLimit();
			self.setGridBodyTextLimit(cfg.field);
			
			self.fireEvent("onViewSizeChange",self,[]);
			
			/*设置group-row width*/
			//if(opt.groupBy === false) return;
			//var render = gid+" .datagrid-view2";
			//var grw = $(render).find(".datagrid-header-row").first().width();
			//$(render).find(".datagrid-group-row td").width(grw);
			self.setGroupRowSize();
			self.setExpandRowSize();
			self.fireEvent("onAfterResize",self,[cfg]);

		},
		//当行的宽度改变时 group row的大小也要随之改变
		setGroupRowSize : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
				
			if(!opt.groupBy) return;	
			var render = gid+" .datagrid-view2";
			var grw = $(render).find(".datagrid-header-row").first().width();
			$(render).find(".datagrid-group-row td").width(grw);
		},
		changeExpandPos : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			$("#view2-datagrid-body-btable-tbody-"+opt.id).find(".datagrid-row-expand").each(function(i){
				if( !$(this).is(":hidden") ) {
					var rowId = $(this).attr("datagrid-expand-row-index");
					self.expandRow(rowId,"");
				}
			});
		},
		//当行的宽度改变时expand row的大小也要随之改变
		setExpandRowSize : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var render = gid+" .datagrid-view2";
			$(render).find(".datagrid-row-expand").each(function(i){
					var rowId = $(this).attr("datagrid-expand-row-index");	
					var obj = $("#"+opt.id+"-row-"+rowId);
					var width = 0;
					obj.find(">td >.datagrid-cell").each(function(i){
						if( !$(this).is(":hidden") ) {
							width += $(this).width();
						}
					});
					$(this).find(".datagrid-cell-expand").width(width);
			});
		},
		isRowHidden : function(rowId) {
			var self = this,
				opt = self.configs,
				gid = opt.gid;
				if(rowId === undefined) return true;
				return ($("#"+opt.id+"-row-"+rowId).size() && !$("#"+opt.id+"-row-"+rowId).is(":hidden") ) ? false : true;
		},
		isExpandRowShow : function(rowId){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var _expand_id = opt.id+"-expand-row-"+rowId;
			
			return ( $("#"+_expand_id).size() && !$("#"+_expand_id).is(":hidden") ) ? true : false;
		},
		//判断当前expandRow是否已经存在 如果不存在则重新创建,如果存在则显示
		expandRow : function(rowId,html){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
		
			var e = opt.events;
			var rowId = typeof rowId === 'undefined' ? false : rowId;
			if(rowId === false) return self;
			var html = typeof html === 'undefined' ? "" : html;
			var data = self.getRowData(rowId);
			html = self.tpl(html,data);//可以是模版
			var obj = $("#"+opt.id+"-row-"+rowId);
			var obj1 = $("#"+opt.id+"-view1-row-"+rowId);
			
			if(obj.size()<=0) return self;
			
			var _expand_id = opt.id+"-expand-row-"+rowId;
			if( $("#"+_expand_id).size() ) {
				obj.after( $("#"+_expand_id) );
			} else {
				var width = 0;
				obj.find(">td >.datagrid-cell").each(function(i){
					if( !$(this).is(":hidden") ) {
						width += $(this).width();
					}
				});
				//var _expand = $("<tr id='"+_expand_id+"' class='datagrid-row-expand' datagrid-expand-row-index='"+rowId+"'><td colspan='"+opt.columns.length+"'><div class=' datagrid-cell-expand' style='overflow:hidden;width:"+width+"px'>"+html+"</div></td></tr>");
				var _expand = $("<tr id='"+_expand_id+"' class='datagrid-row-expand' datagrid-expand-row-index='"+rowId+"'><td colspan='"+opt.columns.length+"'><div class=' datagrid-cell-expand' style='overflow:hidden;width:"+width+"px'></div></td></tr>");
				//判断html是否纯文字或者是选择器or标签
				try {
					if( $(html).size() ) {
						_expand.find("div.datagrid-cell-expand").append( $(html).show() );
					} else {
						_expand.find("div.datagrid-cell-expand").html( html );
					}
				} catch(e) {
					_expand.find("div.datagrid-cell-expand").html( html );	
				}
				obj.after(_expand);	
			}
			
			var _expand_view1_id = opt.id+"-expand-view1-row-"+rowId;
			
			if( opt.rowNumbersWidth!==false || opt.lockColumns.length ) {
				$("#"+_expand_view1_id).remove();//重新生成rownumbers cell 不需要在计算跨列
				var tds = 0;
				var td = "";
				if(opt.lockColumns.length) {
					for(var k in opt.lockColumns) {
						if(opt.lockColumns[k] != null) tds++;
					}
				}
				if(tds) {
					td = '<td colspan="'+tds+'" class="datagrid-cell-rownumber-expand"></td>'	
				}
				var _expand_view1 = $("<tr id='"+_expand_view1_id+"' style='overflow:hidden;'  class='datagrid-row datagrid-row-view1' datagrid-expand-row-index='"+rowId+"'><td class='datagrid-td-rownumber'><div class='datagrid-cell-view1-expand'></div></td>"+td+"</tr>");
				obj1.after(_expand_view1);
				
				//IE 6 7下还是无效 
				var h = $("#"+_expand_id).height();
				$("#"+_expand_view1_id).height(h);
				//修正ie 6 7多出1px问题
				if(h != $("#"+_expand_view1_id).height()) {
					var h = $("#"+_expand_view1_id).height();
					$("#"+_expand_view1_id).height( h-1 );
				}
			}
			var _expand = $.dataGrid._undef(_expand,$("#"+_expand_id));
			var _expand_view1 = $.dataGrid._undef(_expand_view1,$("#"+_expand_view1_id));
			
			if( self.isRowHidden(rowId) ) {
				_expand.hide();
				_expand_view1.hide();
			} else {
				_expand.show();
				_expand_view1.show();
			}
			var h = _expand.height();
			_expand_view1.css({ height:h });
			
			self.fireEvent('onExpandRow',self,[rowId]);
			
			self.fireEvent('onViewSizeChange',self,[]);
		},
		hideExpandRow : function(rowId){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var rowId = typeof rowId === 'undefined' ? false : rowId;
			if(rowId === false) return self;
			
			var _expand_id = opt.id+"-expand-row-"+rowId;
			var _expand_view1_id = opt.id+"-expand-view1-row-"+rowId;
			
			//$("#"+_expand_id).remove();
			//$("#"+_expand_view1_id).remove();
			
			$("#"+_expand_id).hide();
			$("#"+_expand_view1_id).hide();
			
			self.fireEvent('onViewSizeChange',self,[]);
		},
		destroyExpandRow : function(rowId){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var rowId = typeof rowId === 'undefined' ? false : rowId;
			if(rowId === false) return self;
			
			var _expand_id = opt.id+"-expand-row-"+rowId;
			var _expand_view1_id = opt.id+"-expand-view1-row-"+rowId;
			
			$("#"+_expand_id).remove();
			$("#"+_expand_view1_id).remove();
			
			self.fireEvent('onViewSizeChange',self,[]);
		},
		updateExpandRow : function(rowId,html){
			var self = this;
			self.destroyExpandRow( rowId );
			self.expandRow( rowId,html );
		},
		selectAllRows : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var e = opt.events;	
			if(opt.singleSelect) return self; //singleSelect 模式下无效
			//var r = e.onSelectAll.call(self);
			var r = self.fireEvent('onSelectAll',self,[]);
			if(r === false) return self;
			for(var i in opt.data) {
				self.selectRow(i);				
			}
			/*
			$(gid).find("tr.datagrid-row").each(function(idx){
				self.selectRow($(this).attr("datagrid-row-index"));									
			});
			*/
			return self;
		},
		unselectAllRows : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var e = opt.events;	
			
			//var r = e.onUnSelectAll.call(self);
			var r = self.fireEvent('onUnselectAll',self,[]);
			if(r === false) return self;
			
			var rows = self.getSlectRows();
			for(var i in rows) {
				self.unselectRow(rows[i]);
			}
			return self;
		},
		addSelectRecode : function(){
		},
		removeSelectRecode : function(){
				
		},
		selectRow : function(rowId){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var e = opt.events;	
			var render = gid;
			var rowId = typeof rowId === 'undefined' ? false : rowId;
			if(rowId === false) return self;
			
			var rowData = self.getRowData(rowId);
			/*
			2013-08-29 fix
			当selectAllRows时 开销问题解决
			*/
			var obj1 = $("#"+opt.id+"-row-"+rowId);
			var obj2 = $("#"+opt.id+"-view1-row-"+rowId);
			var obj = $(obj1).add(obj2);
			
			if(obj.size()<=0) return self;
			
			var r = self.fireEvent('onSelect',self,[obj,rowId,rowData]);
			if(r === false) return r;
			obj1.attr("datagrid-row-select","1").addClass("datagrid-row-selected");
			obj2.attr("datagrid-row-select","1").addClass("datagrid-row-selected");
			
			if(opt.checkBox){
				var ck = obj.find("td[field='ck'] .datagrid-cell-check input:checkbox");
				//if( !ck.length ) {
//					obj = $("#"+opt.id+"-view1-row-"+rowId);
//					ck = obj.find("td[field='ck'] .datagrid-cell-check input:checkbox");
//				}
				if(ck.length)
					ck.get(0).checked = true;
			}
			/*
			2013-08-29 fix
			当selectAllRows时 开销问题解决
			*/
			
			if( opt.singleSelect) {
				var selects = self.getSlectRows();
				if( selects.length ) {
					for(var si=0;si<selects.length;si++){
						if(selects[si] == rowId) continue;
						self.unselectRow(selects[si]);
					}	
				}
			}
			return self;
		},
		unselectRow : function(rowId){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var e = opt.events;	
			var render = gid;
			var rowId = typeof rowId === 'undefined' ? false : rowId;
			if(rowId === false) return self;
			var rowData = self.getRowData(rowId);
			
			//var obj = $(render).find("tr[datagrid-row-index='"+rowId+"']");
			//var obj = $("#"+opt.id+"-row-"+rowId+",#"+opt.id+"-view1-row-"+rowId);
			var obj1 = $("#"+opt.id+"-row-"+rowId);
			var obj2 = $("#"+opt.id+"-view1-row-"+rowId);
			var obj = $(obj1).add(obj2);
			
			if(obj.size()<=0) return self;
			
			//var r = e.onUnselect.call(obj.get(0),rowId,rowData);
			var r = self.fireEvent('onUnselect',self,[obj,rowId,rowData]);
			if(r === false) return r;
			//obj.attr("datagrid-row-select","0").removeClass("datagrid-row-selected");
			obj1.attr("datagrid-row-select","0").removeClass("datagrid-row-selected");
			obj2.attr("datagrid-row-select","0").removeClass("datagrid-row-selected");
			//obj.find("td[field='ck'] .datagrid-cell-check input:checkbox").get(0).checked = false;
			if(opt.checkBox){
				var ck = obj.find("td[field='ck'] .datagrid-cell-check input:checkbox");
			//	if( !ck.length ) {
//					obj = $(render).find("#"+opt.id+"-view1-row-"+rowId);
//					ck = obj.find("td[field='ck'] .datagrid-cell-check input:checkbox");
//				}
				if(ck.length)
					ck.get(0).checked = false;
			}
			return self;
		},
		showGroup : function(groupId,type){
			var self = this,
				opt = self.configs,
				gid = opt.gid;	
			var render = gid+" .datagrid-view2";	
			var render1 = gid+" .datagrid-view1";
			var type = $.dataGrid._undef(type,'show');
			if( typeof groupId == 'undefined') return self;
			var g1 = $(render).find("tr[datagrid-group-id='"+groupId+"']");
			var g2 = $(render1).find("tr[datagrid-group-id='"+groupId+"']");
			g1[type]();
			g2[type]();
			//expand 的自动展现问题 每次展开group 都会重置expand
			g1.each(function(i){
				var indexid = $(this).attr('datagrid-row-index');
				var _d = self.getRowData( indexid );
				_d['_openExpand'] = $.dataGrid._undef(_d['_openExpand'],false);
				if( _d['_openExpand'] ) {
					self.expandRow(indexid,_d['_expand']);
				}
				if(type == 'hide') {
					self.hideExpandRow(indexid);	
				}
			});
			
			if(type == 'show') {//datagrid_22768-group-row-0
				$(render).find("#"+opt.id+"-group-row-"+groupId).find("div.datagrid-group-cell").addClass("datagrid-group-cell-select");
				$(render1).find("#"+opt.id+"-group-view1-row-"+groupId).find("div.datagrid-group-cell-rownumber").addClass("datagrid-group-cell-rownumber-select");
			} else {
				$(render).find("#"+opt.id+"-group-row-"+groupId).find("div.datagrid-group-cell").removeClass("datagrid-group-cell-select");
				$(render1).find("#"+opt.id+"-group-view1-row-"+groupId).find("div.datagrid-group-cell-rownumber").removeClass("datagrid-group-cell-rownumber-select");
			}
			//rownumber位置刷新
			//opt.gbody.scrollLeft(opt.sLeft);
			//opt.gbody.scrollTop(opt.sTop);
			//opt.gbody.scroll();
			self.fireEvent('onScroll',self,[true]);
			self.fireEvent('onViewSizeChange',self,[]);
			return self;
		},
		hideGroup : function(groupId){
			var self = this;
			return 	self.showGroup(groupId,'hide');
		},
		addGroupRow : function(isFirst){//isFirst = true 隐藏所有行
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var render = gid+" .datagrid-view2";	
			var render1 = gid+" .datagrid-view1";
			if( !opt.groupBy ) return false;
			var isFirst = $.dataGrid._undef(isFirst,false);
			//隐藏
			if(isFirst) {
				$("#view2-datagrid-body-btable-tbody-"+opt.id).find("> tr").hide();
				$("#view1-datagrid-body-btable-tbody-"+opt.id).find("> tr").hide();
			}
			
			var grw = $(render).find(".datagrid-header-row").width();
			
			//var rowNumber = parseFloat(opt.rowNumbersWidth);
			var cls = '';
			if(opt.rowNumbersWidth !== false) {
				cls = 'datagrid-group-cell-rownumber';	
			}
			
			//$(render).find(".datagrid-group-row").remove();
			//$(render1).find(".datagrid-group-row-view1").remove();
			//锁定的列
			var columns = opt.lockColumns;
			var cosp = 0;
			for(var i in columns) {
				if(columns[i] != null)  cosp++;
			}
			for(var i in opt.groupList) {
				opt._groupListData[i] = $.dataGrid._undef(opt._groupListData[i],[]);
				var group_row = self.tpl( self.getTpl("group_row") , {'gid':i,w:parseFloat(grw),'id':opt.id,'colspan':opt.columns.length-cosp,"html":opt.groupList[i],"num":opt._groupListData[i].length} );
				var d = $(render).find(".datagrid-body tr[datagrid-group-id='"+i+"']");//.datagrid-body 兼容行锁
				if( d.size() <= 0 ) {

					d = $(render).find(".datagrid-header .datagrid-header-outer .datagrid-locktable tr[datagrid-group-id='"+i+"']");	
				}
				
				var d1 = $(render1).find("tr[datagrid-group-id='"+i+"']");
				var tpl = "<tr id='"+opt.id+"-group-view1-row-"+i+"' datagrid-group-row-id='"+i+"' class='datagrid-group-row-view1'><td colspan='"+(cosp+1)+"'><div class='"+cls+"'></div></td></tr>";
				var g = $(group_row);
				var _g = $(tpl);
				if( $("#"+opt.id+"-group-row-"+i).size() ) {//重复调用
					$("#"+opt.id+"-group-row-"+i).replaceWith( g );
					$("#"+opt.id+"-group-view1-row-"+i).replaceWith( _g );
					//列锁需要 判断当前Group 是否打开状态
					if( !d.first().is(":hidden") ) {
						_g.find("div.datagrid-group-cell-rownumber").addClass("datagrid-group-cell-rownumber-select");//
					}
				} else if(d.size()) {
					g.insertBefore(d.first());
					_g.insertBefore( d1.first() );
					
					//列锁需要
					if( !d.first().is(":hidden") ) {
						_g.find("div.datagrid-group-cell-rownumber").addClass("datagrid-group-cell-rownumber-select");//
					}
				} else {
					//如果当前分组没有数据
					for(var j=i-1;j>=0;j--) {
						var _d = $(render).find("tr[datagrid-group-id='"+i+"']");
						var _d1 = $(render1).find("tr[datagrid-group-id='"+i+"']");
						if( _d.size() ) {
							g.insertAfter(_d.last());	
							_g.insertAfter( _d1.first() );
							break;
						}
					}
					if(j<0) {
						g.appendTo( $(render).find(".datagrid-body .datagrid-btable tbody") );
						_g.appendTo( $(render1).find(".datagrid-body .datagrid-btable tbody") );
					}
				}
				
				var h = g.height();
				_g.height(h);
				//修正ie 6 7多出1px问题
				if(h != _g.height()) {
					_g.height(h-1);
				}
				opt.groupListCallBack.call(self,g.find(".datagrid-group-cell"),opt.groupList[i],opt._groupListData[i]);
				
			}
			
			self.setGroupEvent();
		},
		setGroupEvent : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
				
			//self.addGroupRow();
			
			var render = gid+" .datagrid-view2";	
			var render1 = gid+" .datagrid-view1";
			//事件绑定
			for(var i in opt.groupList) {
				
				$(render).find("#"+opt.id+"-group-row-"+i).click(function(){
					var groupId = $(this).attr("datagrid-group-row-id");
					var gcell = $(this).find(".datagrid-group-cell");
					if(gcell.hasClass("datagrid-group-cell-select")) {
						self.hideGroup(groupId);
					} else {
						self.showGroup(groupId);
					}
				});
				$(render1).find("#"+opt.id+"-group-view1-row-"+i).click(function(){
					var groupId = $(this).attr("datagrid-group-row-id");
					var gcell = $(this).find(".datagrid-group-cell-rownumber");
					if(gcell.hasClass("datagrid-group-cell-rownumber-select")) {
						self.hideGroup(groupId);
					} else {
						self.showGroup(groupId);
					}
				});
			}
		},
		//对数据按指定的grouplist字段分类，并重新设置configs的data数据，途中会修改configs的 groupBy  groupList
		groupByField : function(field,data,groupList){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			
			var field = $.dataGrid._undef(field,opt.groupBy);	
			var data = $.dataGrid._undef(data,opt.data);
			var groupList = $.dataGrid._undef(groupList,opt.groupList);
			opt._groupList = $.dataGrid._undef(opt._groupList,opt.groupList);
			
			if(field === false) {
				return self;
			}
			
			//字段检测
			//var fields = self.getColumns();
			var fields = opt.columns;
			var index = false;//数据索引 默认 == field
			var _field = false;
			for(var i=0;i<fields.length;i++) {
				if( fields[i]['field'] == field ) {
					_field = field;
					index = fields[i]['index'];
					break;	
				}
			}
			if( _field === false ) {
				opt.groupBy = _field;
				return self;
			}
			field = _field;
			opt.groupBy = field;
			//data数据分类
			var _data = [];
			if(opt._groupList === false) {
				groupList = [];
				for(var i=0;i<data.length;i++) {
					if( self.inArray(data[i][index] , groupList ) === -1 ) {
						groupList.push(data[i][index]);	
					}
				}	
			}
			opt.groupList = groupList;
			
			for(var j=0;j<groupList.length;j++) {
				var _d = [];
				for(var t=0;t<data.length;t++) {
					if( data[t][index] == groupList[j] ) {
						data[t]['_groupid_'] = j;
						_d.push(data[t]);	
					}
				}
				_data[j] = _d;
				_d = [];

			}
			opt._groupListData = _data;
			
			data = [];//清空原有数据
			for(var k in _data) {
				for(var n=0;n<_data[k].length;n++) {
					data.push( _data[k][n] );
				}	
			}
			opt.data = data;
			return self;
		},
		searchData : function(text,field,async,data){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var text = $.dataGrid._undef(text,null);	
			if(text == null) return self;
			
			//清空上一次的搜索缓存
			self.clearSearch(false);
			
			//字段进行检测 是否存在
			var field = $.dataGrid._undef(field,false);	
			var index = false;
			
			//var fields = self.getColumns();
			var fields = opt.columns;
			if(field !== false) {
				var _field = false;
				for(var i=0;i<fields.length;i++) {
					if( fields[i]['field'] == field ) {
						_field = field;
						index = fields[i]['index'];
						break;	
					}
				}
				field = _field;
			}
			
			var async = $.dataGrid._undef(async,true);
			
			
			opt.cacheData['searchAsync'] = async;
			//本地搜索
			if( async ) {
				var data = $.dataGrid._undef(data,opt.cacheData['searchData'] || opt.cacheData['source'] || opt.data);	
				
				if(opt.cacheData['searched'] != true) {
					opt.cacheData['searchData'] = opt.cacheData['searchData'] || data;//存储元数据
					opt.cacheData['_url'] = opt.url;
					opt.cacheData['_pageNumber'] = opt.pageNumber;
					opt.cacheData['_data'] = opt.data;
				
					opt.url = "";
					opt.pageNumber = 1;
				 }
				var _data = [];
				for(var i=0;i<data.length;i++) {
					if(field !== false)	{



						if(data[i][index].toString().indexOf(text) != -1 ) {
							_data.push(data[i]);	
						}
					} else {//全局搜索
						for(var s=0;s<fields.length;s++) {
							
							index =  fields[s]['index'];
							
							if(data[i][ fields[s]['index'] ].toString().indexOf(text) != -1 ) {
								_data.push(data[i]);
								break;
							}	
						}	
					}
				}
				self.setGridData(_data,true);
				self.showGrid(function(){
						//opt.events.onSearch.call(self,_data);
						self.fireEvent('onSearch',self,[_data]);
						self.setGridBody();
				},$.noop,true);
			} else {//服务器搜索
				if(opt.cacheData['searched'] != true) {
					opt.cacheData['_pageNumber'] = opt.pageNumber;
					opt.pageNumber = 1;
				}
				opt.queryParams.searchText = text;	
				//opt.queryParams.searchField = field;
				opt.queryParams.searchField = index;
				
				self.showGrid(function(){
					//opt.events.onSearch.call(self,opt.data);
					self.fireEvent('onSearch',self,[opt.data]);
					self.setGridBody();						  
				});
			}
			
			opt.cacheData['searched'] = true;
			return self;
		},
		//_refresh true 则 清除查询结果并刷新表格; false 不刷新表格
		clearSearch : function( _refresh ){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			
			if(opt.cacheData['searched'] !== true) {
				return self;	
			}
			var _refresh = $.dataGrid._undef( _refresh,true );
			
			opt.cacheData['searched'] = false;
			
			self.setGridData(opt.cacheData['searchData']);
			
			opt.url = opt.cacheData['_url'] || opt.url;
			opt.pageNumber = opt.cacheData['_pageNumber'] || opt.pageNumber;
			opt.data = opt.cacheData['_data'] || opt.data;
			
			try{
			delete opt.cacheData['_url'];
			} catch(e){}
			try{
			delete opt.cacheData['_pageNumber'];
			} catch(e){}
			try{
			delete opt.cacheData['searchData'];
			} catch(e){}
			try{
			delete opt.cacheData['_data'];
			} catch(e){}
			
			try{
			delete opt.queryParams['searchText'];
			} catch(e){}
			try{
			delete opt.queryParams['searchField'];
			} catch(e){}
			
			if( !opt.cacheData['searchAsync'] ){//if(opt.url != "") 
				delete opt.cacheData['source'];
			}
			
			if( _refresh ) {
				if(opt.cacheData['searchAsync']) {
					self.refreshDataCache();
				} else {
					self.refreshData();	
				}
			}
			delete opt.cacheData['searchAsync'];
			
			return self;
		},
		onOverRow : function(rowId){
			var self = this,
				opt = self.configs,
				gid = opt.gid;	
			$("#"+opt.id+"-view1-row-"+rowId).addClass("datagrid-row-over");
			$("#"+opt.id+"-row-"+rowId).addClass("datagrid-row-over");
			/*var obj = $(gid).find("tr[datagrid-row-index='"+rowId+"']");
			obj.addClass("datagrid-row-over");*/
		},
		onOutRow : function(rowId){
			var self = this,
				opt = self.configs,
				gid = opt.gid;		
			$("#"+opt.id+"-view1-row-"+rowId).removeClass("datagrid-row-over");
			$("#"+opt.id+"-row-"+rowId).removeClass("datagrid-row-over");
			/*var obj = $(gid).find("tr[datagrid-row-index='"+rowId+"']");
			obj.removeClass("datagrid-row-over");*/
		},
		setGridBodyTextLimit : function(field,data){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var render = gid;
			
			if(!opt.textLimit) 
				return false;
			
			if(typeof field === 'undefined') {
				var data = opt.data;
				var fields = opt.columns;
				
				for(var i in fields) {
					if(fields[i]['textLimit'] === false) continue;
					
					var f = $(render).find(".datagrid-view2 .datagrid-body td[field='"+fields[i]['field']+"']");//.find("div.datagrid-cell");
					
					f.each(function(idx){
						var rid = $(this).parent().attr("datagrid-row-index");
						var data = self.getRowData(rid);
						var value = $(this).find("div.datagrid-cell").html();
						
						if( typeof data[ fields[i]['index'] ] === 'undefined' ) {
							self.setRowData(rid,fields[i]['index'],value);
						}
						//value = data[ fields[i]['field'] ];//注意
						value = data[ fields[i]['index'] ];
						
						var w = $(this).find("div.datagrid-cell").width();
						var fs = $(this).find("div.datagrid-cell").css("fontSize");
						var text = value;
						
						text = self.textLimit( text , w , fs );
						
						$(this).find("div.datagrid-cell").html( text );
						
					});
				}
			} else if( arguments.length == 2 ){//
				var tr = field;
				var fields = opt.columns;
				var textLimitFields = [];//那些字段需要字符剪切
				var rowId = tr.attr('datagrid-row-index');
				var data = data;
				var value = '';
				for(var i in fields) {
					if(fields[i]['textLimit'] === false) continue;
					//value = $.dataGrid._undef(data[ fields[i]['field'] ],"");
					value = $.dataGrid._undef(data[ fields[i]['index'] ],"");
					if(value == "") continue;
					var td_cell = tr.find("td[field='"+fields[i]['field']+"'] div.datagrid-cell");
					var w = td_cell.width();
					var fs = td_cell.css("fontSize");
					var text = value;
					
					text = self.textLimit( text , w , fs );
						
					td_cell.html( text );
				}
			} else {
				var textLimit = self.getColumnData(field,'textLimit');
				if( textLimit ) {
					var f = $(render).find("tr.datagrid-row td[field='"+field+"']");//.find("div.datagrid-cell");
					
					var index = self.getColumnData(field,'index');
					
					f.each(function(idx){
						var rid = $(this).parent().attr("datagrid-row-index");
						var data = self.getRowData(rid);
						var value = $(this).find("div.datagrid-cell").html();
						
						if( typeof data[ index ] === 'undefined' ) {
							self.setRowData(rid,index,value);
						}
						//value = data[ field ];//注意
						value = data[ index ];//注意
						
						var w = $(this).find("div.datagrid-cell").width();
						var fs = $(this).find("div.datagrid-cell").css("fontSize");
						var text = value;
						
						text = self.textLimit( text , w , fs );
						
						$(this).find("div.datagrid-cell").html( text );
						
					});	
				}
			}
		},
		bindRowEvent : function( tr,ltr ){
			var self = this,
				opt = self.configs,
				data = opt.data,
				gid = opt.gid;
				
			if( typeof tr === "undefined" ) {
				tr = false;	
			}
			if( typeof ltr === "undefined" ) {
				ltr = false;	
			}
			var fields = opt.columns;
			
			var tr_events = {
				'click' : function(ev){
					var rowId = $(this).attr("datagrid-row-index");
					var rowData = self.getRowData(rowId);
					
					//自动显示当前行隐藏部分
					if( opt.autoScrollToRow ) {
						self.scrollToRow(rowId);	
					}
					//触发单元格事件
					var cr = self.cellEvents(rowId,ev);
					if(cr === false) return false;
					
					var r = self.fireEvent('onClickRow',self,[this,rowId,rowData,ev]);
					if(r === false) return false;
					//触发行 是否选择事件
					var isSelect = $(this).attr("datagrid-row-select");
					var selects = self.getSlectRows();
					if( isSelect == "1" ) {
						if(opt.singleSelect) {
							if(selects.length==1 && selects[0] != rowId) {
								self.unselectRow(rowId);	
							}
						} else {
							self.unselectRow(rowId);
						}
					} else {
						self.selectRow(rowId);
					}
					
				},
			/*	'mouseenter' : function(e){
					var rowId = $(this).attr("datagrid-row-index");	
					
					self.fireEvent("onOverRow",self,[rowId,e]);
				},*/
				'mouseover' : function(e){
					var rowId = $(this).attr("datagrid-row-index");	

					//触发单元格事件
					var cr = self.cellEvents(rowId,e);	
					if(cr === false) return false;
					
					self.fireEvent("onOverRow",self,[rowId,e]);
				},
			/*	'mouseleave' : function(e){
					var rowId = $(this).attr("datagrid-row-index");	
					
					self.fireEvent("onOutRow",self,[rowId,e]);
				},*/
				'mouseout' : function(e){
					var rowId = $(this).attr("datagrid-row-index");	

					//触发单元格事件
					var cr = self.cellEvents(rowId,e);	
					if(cr === false) return false;
					
					self.fireEvent("onOutRow",self,[rowId,e]);
				},
				'dblclick' : function(e){
					var rowId = $(this).attr("datagrid-row-index");
					var rowData = self.getRowData(rowId);

					//触发单元格事件
					var cr = self.cellEvents(rowId,e);
					if(cr === false) return false;
					
					var r = self.fireEvent('onDblClickRow',self,[this,rowId,rowData,e]);
					if(r == false) return false;
				},
				'contextmenu' : function(ev){
					var rowId = $(this).attr("datagrid-row-index");
					var rowData = self.getRowData(rowId);
					var r = self.fireEvent('onRowContextMenu',self,[this,rowId,rowData,ev]);
					if(r == false) return false;
				}
			};
			
			if(tr) {
				tr.bind(tr_events);
				tr.each(function(){
					var tr = $(this);
					var rowId = $(this).attr("datagrid-row-index");
					var rowData = self.getRowData(rowId);
					//行回调
					if( $.isFunction(opt.rowCallBack) && opt.rowCallBack != $.noop ) {
						opt.rowCallBack.call(self,tr,rowId,rowData);
					}
					if( opt.rowStyler ) {
						if( $.isFunction(opt.rowStyler) ) {
							var rstyle = opt.rowStyler.call(self,tr,rowId,rowData);
							if( typeof rstyle == 'string' ) {
								tr.addClass(rstyle);	
							}
						} else if( typeof opt.rowStyler == 'string' ) {
							tr.addClass(opt.rowStyler);	
						}	
					}
					//单元格回调
					var field = [];
					for(var j in fields) {
						field = fields[j];
						if( !$.isFunction(field['callBack']) || field['callBack'] == opt.noop ) {
							//是否有单元格回调
							continue;	
						}
						
						var t = $("#"+opt.id+'_'+field["field"]+'_row_'+rowId+'_cell');
						field['callBack'].call(self,t,rowId,field,rowData);
					}
					
					//检测文字是否超出
					self.setGridBodyTextLimit(tr,rowData);
					
				});
			}
			
			if( ltr ) {
				
					var ltr_events = {
					'click' : function(e){
						var rowId = $(this).attr("datagrid-row-index");
						var rid = rowId;
						
						var target = e.srcElement ? e.srcElement : e.target;
						
						//触发单元格事件
						var cr = self.cellEvents(rowId,e);	
						if(cr === false) return false;	
						
						self.fireEvent('onClickRowNumber',self,[rid,e]);
						if( opt.rowNumbers2Row !== false ) {
							//self.selectRow(rid);
							$("#"+opt.id+"-row-"+rid).trigger('click');
						}
					},
					'mouseover' : function(e){
						var rowId = $(this).attr("datagrid-row-index");
						
						//触发单元格事件
						var cr = self.cellEvents(rowId,e);	
						if(cr === false) return false;	
						
						self.fireEvent("onOverRow",self,[rowId,e])
						
					},
					'mouseout' : function(e){
						
						var rowId = $(this).attr("datagrid-row-index");
						
						//触发单元格事件
						var cr = self.cellEvents(rowId,e);	
						if(cr === false) return false;	
						
						self.fireEvent("onOutRow",self,[rowId,e]);
					},
					'dblclick' : function(e){
						
						//触发单元格事件
						var cr = self.cellEvents(rowId,e);	
						if(cr === false) return false;	
						
						if( opt.rowNumbers2Row !== false ) {
							//self.selectRow(rid);
							$("#"+opt.id+"-row-"+rid).trigger('dblclick');
						}
						
					},
					'contextmenu' : function(ev){
					}
				};
				//view1 行事件绑定
				ltr.bind(ltr_events);
			}
		},
		isCell : function(o){
			
			if( !$(o).length )
				return false;
			
			//检测是否rowNumber
			if( $(o).is('td') && $(o).hasClass('datagrid-td-rownumber') ) {
				return false;
			}	
			if( $(o).is('tr') && $(o).hasClass('datagrid-row') ) {
				return false;	
			}
			//检测是否有datagrid-cell
			if( !$(o).hasClass("datagrid-cell") ) {
				var cell = $(o).closest("tr.datagrid-row div.datagrid-cell");	
				if( !cell.length ) {
					return false;
				}
			}
			
			return true;
		},
		cellEvents : function(rowId,e) {
			var self = this,
				opt = self.configs;
			var target = e.srcElement ? e.srcElement : e.target;
			
			//检测当前是否对象是否单元格
			if( !self.isCell(target) ) {
				return true;	
			}
			
			var cell = $(target);
			
			var field = cell.parent("td").attr("field");

			var value = self.getFieldValue(rowId,field);
			
			var r = true;
			
			switch( e.type ) {
				case 'click' :
					//自动显示当前行隐藏部分
					if( opt.autoScrollToField ) {
						self.scrollToField(field);	
					}
				
					r = self.fireEvent('onClickCell',self,[cell.eq(0),rowId,field,value,e]);
					break;
				case 'dblclick' :
					r = self.fireEvent('onDblClickCell',self,[cell.eq(0),rowId,field,value,e]);
					break;
				case 'mouseover' : //case 'mouseenter' : 
					r = self.fireEvent('onOverCell',self,[cell.eq(0),rowId,field,value,e]);
					break;
				case 'mouseout' :
					r = self.fireEvent('onOutCell',self,[cell.eq(0),rowId,field,value,e]);
					break;
			}
			return r;
		},
		//行 生成
		setRow : function(n,_func){
			var self = this,
				opt = self.configs,
				data = opt.data,
				gid = opt.gid;
			var fields = opt.columns;
			
			var view1_row_tpl = self.getTpl("view1_row");
			var view2_row_tpl = opt.rowTpl ? opt.rowTpl : self.getTpl("view2_row");
			var _d = {};
			var view2_tbodyId = $("#view2-datagrid-body-"+opt.id);
			var view1_tbodyId = $("#view1-datagrid-body-"+opt.id);
			var _func = $.dataGrid._undef(_func,$.noop);
			var n = $.dataGrid._undef(n,0);

			
			var j = opt._lSize;
			var pos = 1;
			var rows_view1 = ['<table class="datagrid-btable" id="view1-datagrid-body-btable-'+opt.id+'" cellspacing="0" cellpadding="0" border="0"><tbody id="view1-datagrid-body-btable-tbody-'+opt.id+'">'];
			var rows_view2 = ['<table class="datagrid-btable" id="view2-datagrid-body-btable-'+opt.id+'" cellspacing="0" cellpadding="0" border="0"><tbody id="view2-datagrid-body-btable-tbody-'+opt.id+'">'];
			
			var rowIds = [];
			
			if(  !$.isArray(data) ) {
				data = [];	
			}
			
			for(var i=n;i<data.length;i++){
				//只显示某部分数据
				if(j>0) {
					if(pos>j) {
						break;
					}
					pos++;
					opt._lStart = pos;
				}
				
				rowIds.push(i);
				
				_d = {
					i : i,
					id : opt.id,
					fields : fields	,
					rowNumbersExpand : opt.rowNumbersExpand ? opt.rowNumbersExpand : false,
					data : data[i],
					isCreate : opt.isCreate,
					groupBy : opt.groupBy,
					rowNumbersWidth : opt.rowNumbersWidth,
					opt : opt
				};
				
				var tr = self.tpl(view2_row_tpl,_d);
				
				rows_view2.push(tr);
				
				var ltr = false;
				if( opt.rowNumbersWidth!==false ) {
					ltr = self.tpl(view1_row_tpl,_d);
					rows_view1.push(ltr);
				}
				
			}
			
			rows_view2.push('</tbody></table>');
			rows_view1.push('</tbody></table>');
			
			view2_tbodyId.html(rows_view2.join(""));
			view1_tbodyId.html( rows_view1.join("") );
			
			
			var tr = false;
			var ltr = false;
			
			
			//如果自定义opt.rowTpl 那么就添加系统必要的元素
			if( opt.rowTpl ) {
				tr = $(">tr","#view2-datagrid-body-btable-tbody-"+opt.id);
				tr.each(function(t){
					var tr = $(this);
					var rowId = rowIds[t];
					var i = rowId;
						tr.find(">td,>th").each(function(f){
							var tdId = opt.id+'_'+fields[f]['field']+'_row_'+rowId+'_td';
							var cellId = opt.id+'_'+fields[f]['field']+'_row_'+rowId+'_cell';
							var $this = this;
							if( $(this).is("th") ) {
								$this = $("<td id='"+tdId+"' field='"+fields[f]['field']+"' align='"+fields[f]['align']+"'><div  id='"+cellId+"'  class='datagrid-cell datagrid-cell-c1-"+fields[f]['field']+" ' style='width:"+fields[f]['width']+";'>"+$(this).html()+"</div></td>");
								$(this).replaceWith( $this );
							} else {
								$(this).attr("field",fields[f]['field'])
									   .attr("align",fields[f]['align'])
									   .attr("id",tdId)
									   .html("<div  id='"+cellId+"' class='datagrid-cell datagrid-cell-c1-"+fields[f]['field']+" ' style='width:"+fields[f]['width']+";'>"+$(this).html()+"</div>");
							}						 
						});
						
						tr.addClass("datagrid-row")
						  .attr("id",opt.id+"-row-"+i)
						  .attr("datagrid-row-index",i)
						  .attr("datagrid-row-select",0);
						if( typeof data[i]["_groupid_"] != 'undefined') {
							tr.attr("datagrid-group-id",data[i]["_groupid_"]);
						}
									 
				});
			} else {
				tr = $(">tr.datagrid-row","#view2-datagrid-body-btable-tbody-"+opt.id);	
			}
			
			if( opt.rowNumbersWidth!==false ) {
				ltr = $(">tr.datagrid-row","#view1-datagrid-body-btable-tbody-"+opt.id);
			}
			
			if( opt.denyRowEvents === false ) {
				self.bindRowEvent(tr,ltr);
			} else if( $.isFunction(opt.denyRowEvents) ) {
				opt.denyRowEvents.call(self,tr,ltr);	
			}
			
			_func();
			
			self.afterGridShow();
			
		},
		//模版函数

		view2_row : function(d){
			
			if( !d ) return "";
			var self = this,
				opt = self.configs,
				data = opt.data,
				gid = opt.gid;
			//var  group_id = ( typeof d.data["_groupid_"] != "undefined" )? "datagrid-group-id="+d.data["_groupid_"] : "";
			var group_id = [];
			if( typeof d.data["_groupid_"] != "undefined" ) {
				group_id.push('datagrid-group-id=');
				group_id.push(d.data["_groupid_"]);
			}
			group_id = group_id.join("");
			
			var modelTr = ((d.i+1)%2 ? "datagrid-row-single" : "datagrid-row-double");
			//var tr = ['<tr id="'+d.id+'-row-'+d.i+'" '+group_id+' datagrid-row-index="'+d.i+'" datagrid-row-select="0" class="datagrid-row '+modelTr+'">'];
			var tr = [];
			tr.push('<tr id="');
			tr.push(d.id);
			tr.push('-row-');
			tr.push(d.i);
			tr.push('" ');
			tr.push(group_id);
			tr.push(' datagrid-row-index="');
			tr.push(d.i);
			tr.push('" datagrid-row-select="0" class="datagrid-row ');
			tr.push(modelTr);
			tr.push('">');
			
			for(var j in d.fields) {
				//var tdId = opt.id+'_'+d.fields[j]["field"]+'_row_'+d.i+'_td';
				var tdId = [];
				tdId.push(opt.id);
				tdId.push('_');
				tdId.push(d.fields[j]["field"]);
				tdId.push('_row_');
				tdId.push(d.i);
				tdId.push('_td');
				tdId = tdId.join("");
				
				//var cellId = opt.id+'_'+d.fields[j]["field"]+'_row_'+d.i+'_cell';
				var cellId = [];
				cellId.push(opt.id);
				cellId.push('_');
				cellId.push(d.fields[j]["field"]);
				cellId.push('_row_');
				cellId.push(d.i);
				cellId.push('_cell');
				cellId = cellId.join("");
				
				var field = d.fields[j]["field"];
				var index = d.fields[j]["index"];
				var _expand = d.fields[j]["_expand"] !== false ? opt.self.tpl(d.fields[j]["_expand"],d.data) : d.data[index];
				
				//tr.push('<td field="'+field+'" id="'+tdId+'" align="'+d.fields[j]["align"]+'">');
				tr.push('<td field="');
				tr.push(field);
				tr.push('" id="');
				tr.push(tdId);
				tr.push('" align="');
				tr.push(d.fields[j]["align"]);
				tr.push('">');
				
				//tr.push('<div id="'+cellId+'" class="datagrid-cell datagrid-cell-c1-'+field+' '+d.fields[j]["bcls"]+'" style="width:'+d.fields[j]["width"]+';" >'+_expand+'</div></td>');
				tr.push('<div id="');
				tr.push(cellId);
				tr.push('" class="datagrid-cell datagrid-cell-c1-');
				tr.push(field);
				tr.push(' ');
				tr.push(d.fields[j]["bcls"]);
				tr.push('" style="width:');
				tr.push(d.fields[j]["width"]);
				tr.push(';" >');
				tr.push(_expand);
				tr.push('</div></td>');
			}
			tr.push('</tr>');
			
			return tr.join("");
		},
		//模版函数
		view1_row : function(d){
			if( !d ) return "";
			var self = this,
				opt = self.configs,
				data = opt.data,
				gid = opt.gid;
			//var  group_id = ( typeof d.data["_groupid_"] != "undefined" )? "datagrid-group-id="+d.data["_groupid_"] : "";
			var group_id = [];
			if( typeof d.data["_groupid_"] != "undefined" ) {
				group_id.push('datagrid-group-id=');
				group_id.push(d.data["_groupid_"]);
			}
			group_id = group_id.join("");
			
			var modelTr = ((d.i+1)%2 ? "datagrid-row-single" : "datagrid-row-double");
			//var tdId = opt.id+'_row_'+d.i+'_td_rownumber';
			var tdId = [];
				tdId.push(opt.id);
				tdId.push('_row_');
				tdId.push(d.i);
				tdId.push('_td_rownumber');
				tdId = tdId.join("");
			
			//var cellId = opt.id+'_row_'+d.i+'_cell_rownumber';
			var cellId = [];
				cellId.push(opt.id);
				cellId.push('_row_');
				cellId.push(d.i);
				cellId.push('_cell_rownumber');
				cellId = cellId.join("");
			
			//var tr = ['<tr id="'+d.id+'-view1-row-'+d.i+'" '+group_id+' datagrid-row-index="'+d.i+'" datagrid-row-select="0" class="datagrid-row datagrid-row-view1 '+modelTr+'">'];
			var tr = [];
			tr.push('<tr id="');
			tr.push(d.id);
			tr.push('-view1-row-');
			tr.push(d.i);
			tr.push('" ');
			tr.push(group_id);
			tr.push(' datagrid-row-index="');
			tr.push(d.i);
			tr.push('" datagrid-row-select="0" class="datagrid-row datagrid-row-view1 ');
			tr.push(modelTr);
			tr.push('">');
			
			//tr.push('<td id="'+tdId+'" align="center" class="datagrid-td-rownumber"><div id="'+cellId+'" class="datagrid-cell-rownumber" style="width:'+parseFloat(d.rowNumbersWidth)+'px;">'+(d.rowNumbersExpand === false ? ++d.i : opt.self.tpl(d.rowNumbersExpand,d.data))+'</div></td>');//--
			tr.push('<td id="');
			tr.push(tdId);
			tr.push('" align="center" class="datagrid-td-rownumber"><div id="');
			tr.push(cellId);
			tr.push('" class="datagrid-cell-rownumber" style="width:');
			tr.push(parseFloat(d.rowNumbersWidth));
			tr.push('px;">');
			var _expand_Num = d.rowNumbersExpand === false ? ++d.i : opt.self.tpl(d.rowNumbersExpand,d.data);
			tr.push( _expand_Num );
			tr.push('</div></td>');
			
			
			tr.push('</tr>');

			return tr.join("");
		},
		resetHeader : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			if(opt.lockColumns.length) {
				for(var j in opt.lockColumns) {
					if(opt.lockColumns[j] != null) {
						self.setGridHeader();
						return;
					}	
				}	
			}
			if(opt.lockRows.length) {
				for(var j in opt.lockRows) {
					if(opt.lockRows[j] != null) {
						self.setGridHeader();
						return;
					}	
				}	
			}
		},
		//必须要返回一个html dom
		setGridBody : function(render,func){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
				
			self.showLoading();	
			//刷新gridHeader 数据
			self.getColumns();
			
			var func = func || $.noop;
			
			self.fireEvent('onBeforeShowGrid',self,[]);
				
			//self.fireEvent('onViewSizeChange',self,[]);
			//修正IE 下刷新白屏问题
			setTimeout(function(){
				//对数据分类
				self.groupByField();
				
				var data = opt.data;
				
				//self.fireEvent('onBeforeShowGrid',self,[]);
				
				//self.fireEvent('onViewSizeChange',self,[]);
	
				//更新分页工具栏
				self.setPager();
				
				//记录当前滚动条位置
				//self.setRow(0,func);//grid 生成
				var sLeft = opt.sLeft;
				var sTop = opt.sTop;
				self.setRow(0,function(){
					func();	
					opt.sLeft = sLeft;
					opt.sTop = sTop;
				});
				self.hideLoading();
			},0);
			
			return true;
		},
		//setRow 结束后需要处理的问题
		afterGridShow : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			
			//是否初始加载
			self.onFinishDone = self.onFinishDone || false;
			if(!self.onFinishDone) {
				self.onFinishDone = true;
				//e.onFinish.call(self);
				self.fireEvent('onFinish',self);
			}
			
			
			//更新
			self.addGroupRow(true);
			
			self.fireEvent('onScroll',self,[true]);
			
			self.methodCall('setGridBody');

			self.fireEvent('onViewSizeChange',self,[]);
			
			self.fireEvent('onShowGrid',self,[]);
			
		},
		isEmptyGrid : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			
			if( !opt.showEmptyGridMsg ) {
				return;	
			}
			
			if( !opt.showHeader ) {
				$("#"+opt.id+"_empty-grid-msg").remove();	
			}
			
			if( opt.data.length>=1 || !opt.showHeader ) return;
			var w = $("#view2-datagrid-header-inner-htable-"+opt.id).outerWidth();
			
			var obj = $("#"+opt.id+"_empty-grid-msg")
			
			if( obj.size() ) {
				obj.width( w );
				return;
			}
			var dom = $('<div class="empty-grid-msg" id="'+opt.id+'_empty-grid-msg" style="height:100%;">'+self.tpl( opt.emptyGridMsg,opt )+'</div>').width( w );
			$("#view2-datagrid-body-"+opt.id).empty().append( dom );
		},
//		resetGridBody : function(render,func){
//			var self = this;
//			var func = func || $.noop;
//			self.showGrid(function(){
//				self.setGridBody(render,func);						  
//			});	
//		},
		setGridFooter : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			//var fields = self.getColumns();
			return true;
		},
		//未完成
		onScroll : function(auto){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var render = render || gid+" .datagrid-view2";
			var render1 = gid+" .datagrid-view1";
			auto = $.dataGrid._undef(auto,false);	
			if(auto) { // IE 下 300ms ++
				if( opt.sLeft>=0 )
					opt.gbody.scrollLeft(opt.sLeft);
				if( opt.sTop>=0 )
					opt.gbody.scrollTop(opt.sTop);
			}
			
			
			if(!auto) {
				opt.sLeft = opt.gbody._scrollLeft();
				opt.sTop = opt.gbody._scrollTop();
			}
			
			//$(render+" .datagrid-header .datagrid-header-inner .datagrid-header-inner-wraper")._scrollLeft( opt.sLeft );
			$("#view2-datagrid-header-inner-"+opt.id).find(">.datagrid-header-inner-wraper")._scrollLeft( opt.sLeft );
			//$(render+" .datagrid-header .datagrid-header-outer .datagrid-header-outer-wraper")._scrollLeft( opt.sLeft );
			$("#view2-datagrid-header-outer-"+opt.id).find(">.datagrid-header-outer-wraper")._scrollLeft( opt.sLeft );
			
			
			
			//$(render1+" .datagrid-body")._scrollTop( opt.sTop );
			$("#view1-datagrid-body-"+opt.id)._scrollTop( opt.sTop );
			
			
		},
		//统一使用该函数来实现表格展示
		showGrid : function(successBack,errorBack,async){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var render = render || gid+" .datagrid-view2";
			
			var successBack = successBack || $.noop;
			var errorBack = errorBack || $.noop;
			var async = $.dataGrid._undef(async,false);	

			
			self.getGridData(function(){
				self.fireEvent('onGetData',self,[opt.data]);
				successBack.apply(this,arguments);	
			},function(){
				errorBack.apply(this,arguments);
			},async);
		},
		//刷新表格数据
		refreshData : function(){
			var e = this.configs.events;
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var render = render || gid+" .datagrid-view2";
			//e.onBeforeRefresh.call(self);	
			self.fireEvent('onBeforeRefresh',self);
			self.showGrid(function(){
				self.setGridBody(render,function(){
					//e.onRefresh.call(self);	
					self.fireEvent('onRefresh',self);
				});						  
			});
		},
		updateGrid : function(data){
			var self = this,
				opt = self.configs;
			self.setGridData(data,false,true);
		},
		//无ajax刷新表格数据
		refreshDataCache : function(){
			var self = this;
			self.setGridBody();
		},
		clearCache : function(){
			var opt = this.configs;
			//缓存清除
			opt.views = [];//清空视图缓存
			opt.isCreate = false;//已经废弃
			this.onFinishDone = false;
			opt.isShow = false;
			opt.pki = 0;
		},
		clearDataCache : function(){
			var opt = this.configs;
			opt.cacheData = [];
			return this;
		},
		//重新生成grid 慎用 setAll是否重置所有数据 否则保留source columns
		reLoadGrid : function(cfg,setAll/*废弃*/){
			//var setAll = $.dataGrid._undef(setAll,false);
			this.clearCache();
			this.clearDataCache();
			var _d = [];
			if(cfg.data) {
				_d = cfg.data ;
				cfg.data = [];
			}
			var opt = $.extend(true,{},cfg);
			opt.data = _d;
			$.dataGrid.call(this,opt);
		},
		setWH : function(width,height){
			var self = this;
			self.fireEvent("onSizeChange",self,[width,height]);
			return self;
		},
		//设置参数
		C : function(key,value){
			if( typeof key == 'undefined') {
				return this.configs;	
			}
			if( typeof value == 'undefined') {
				return this.configs[key];
			}
			this.configs[key] = value;
			return this;
		},
		createGrid : function(render){
			
			var self = this,
				opt = self.configs,
				gid = opt.gid;
				
			
			var render = render || gid+" .datagrid-view2";

			self.setGridHeader(render);

			//opt.gbody = self.setGridBody(render);//grid数据列表
			self.showGrid(function(){
				self.setGridBody(render);
			});

			self.setGridFooter(render);
			
			//重设gird 
			//self.resetGridHeight(render,opt.gbody,[opt.gheader,opt.gfooter]);
			
			//设置gird已经创建标志
			//opt.isCreate = true;
			//开始获取griddata数据
			
			
			self.methodCall('createGrid');
			return self;
		}, 
		//对数据进行排序,返回排序后的结果，不支持中文排序 可对没显示字段进行排序
		sortData : function(field,data,type) {//对field列进行排序 type = asc type= desc
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var field = $.dataGrid._undef(field,opt.sortName);
			if( field == '' ) return self;
			//字段检测
			//var fields = self.getColumns();
			var fields = opt.columns;
			var _field = false;
			var index = false;
			
			for(var i=0;i<fields.length;i++) {
				if( fields[i]['field'] == field ) {
					_field = field;
					index = fields[i]['index'];
					break;	
				}
			}
			if( _field === false ) return self;
			//排序处理
			opt.cacheData['source'] = opt.cacheData['source'] || opt.data;
			var data = $.dataGrid._undef(data,opt.cacheData['source']);
			var type = $.dataGrid._undef(type,opt.sortOrder);
			var isAsc = type == "asc" ? true : false;
			
			data.sort(function(a,b){
				//a[field] = $.dataGrid._undef(a[field],"");
				//b[field] = $.dataGrid._undef(b[field],"");
				a[index] = $.dataGrid._undef(a[index],"");
				b[index] = $.dataGrid._undef(b[index],"");
				if( a[index] >=  b[index]) return isAsc ? 1 : -1;
				return isAsc ? -1 : 1;
			});
			return data;
		},
		//数据管理 addData 添加表格数据 updateData更新表格数据 removeData删除表格数据
		//如果是opt.url 存在则发送数据到服务器
		//如果async = true的话 就所有操作都在本地进行
		//最好通过自己的函数向服务器添加数据然后调用refreshData 如果本地的话就无所谓
		onDataChange : function(data){
			var self = this,
				opt = self.configs;	
			self.refreshData();
		},
		addData : function(data){
			var self = this,
				opt = self.configs;
				
			var async = self.getAsync();
			
			var datas = $.dataGrid._undef( datas , [] );
			datas = $.isPlainObject(datas) ? [datas] : datas;
			
			var pk = opt.pk;
			//本地添加
			if( async ) {
				var _d = self.getData();
				for(var n=0;n<datas.length;n++) {
					var data = datas[n];
					data[pk] = $.dataGrid._undef( data[pk] , self.unique() );
					_d.push(data);
				}
				self.fireEvent("onAdd",self,[datas,true]);
				self.fireEvent("onDataChange",self,[datas]);
			} else {
				//远程处理		
				self.fireEvent("onAjaxAdd",self,[datas,function(){self.onDataChange(datas);}]);
			}
		},
		updateData : function(datas){
			var self = this,
				opt = self.configs;
				
			var async = self.getAsync();
			
			var datas = $.dataGrid._undef( datas , [] );
			datas = $.isPlainObject(datas) ? [datas] : datas;
			var pk = opt.pk;
			var setPk = false;
			//本地更新
			if( async ) {
				for(var n=0;n<datas.length;n++) {
					var data = datas[n];
					if( !$.isPlainObject(data)) continue;
					setPk = $.dataGrid._undef( data[pk] , false );
					if(setPk === false) {
						continue;
					}
					
					var _d = self.getData();
					for(var i in _d) {
						if(_d[i][pk] == data[pk]) {
							_d[i] = data;
							break;
						}	
					}
				}
				self.fireEvent("onUpdate",self,[datas,true]);
				self.fireEvent("onDataChange",self,[datas]);
			} else {
				//远程处理	
				self.fireEvent("onAjaxUpdate",self,[datas,function(){self.onDataChange(datas);}]);
			}
		},
		deleteData : function(datas){
			var self = this,
				opt = self.configs;
				
			var async = self.getAsync();
			
			var datas = $.dataGrid._undef( datas , [] );
			datas = $.isPlainObject(datas) ? [datas] : datas;
			var pk = opt.pk;
			var setPk = false;
			//本地删除
			if( async ) {
				var _d = self.getData();
				for(var n=0;n<datas.length;n++) {
					var data = datas[n];
					if( !$.isPlainObject(data)) continue;
					setPk = $.dataGrid._undef( data[pk] , false );
					if(setPk === false) {
						continue;
					}
					
					for(var i in _d) {
						if(_d[i][pk] == data[pk]) {
							break;
						}	
					}
					var __d = [];//删除后的新数据
					for(var j in _d) {
						if( i == j ) continue;
						__d.push(_d[j]);	
					}
					_d = __d;
				}
				//opt.cacheData['source'] = __d;
				
				self.fireEvent("onDelete",self,[datas,true]);
				self.fireEvent("onDataChange",self,[datas]);
			} else {
				//远程处理	
				self.fireEvent("onAjaxDelete",self,[datas,function(){self.onDataChange(datas);}]);
			}
		},
		//判断当前的操作是 服务器还是本地 true 表示本地操作
		getAsync : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;	
			return (opt.url == "" || opt.url===false)  ? true : false;
		},
		//设置grid的data数据,
		setGridData : function(data , async , s){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
				
			var async = $.dataGrid._undef(async,false);	
			var s = $.dataGrid._undef(s,false);	
			if(async == false) {
				async = self.getAsync();
			}
			
			if( async ) {
				opt.cacheData['source'] = data;
			} else {
				opt.data = data;	
			}
			//数据重置后 PK值也的重置
			if(opt.pk == '_pk') {
				opt.pk = '';
				self.fireEvent("onSetPk",self,[data]);
			}
			
			//数据源改变时调用
			if( s ) {
				if( async )
					self.showGrid(function(){
						self.setGridBody();							   
					},$.noop,true);	
				else 
					self.refreshDataCache();
			}
		},
		// xmlFilter... htmlFilter...
		jsonFilter : function(data){
			return data;	
		},
		onLoadSuccess : function(data,successBack){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			
			var dataType = opt.dataType.toLowerCase();
			
			var filter = dataType+'Filter';
			
			var data = data;
			
			if( filter in self ) {
				if( $.isFunction( self[filter] ) ) {
					data = self[filter].call(self,data);
				}
			}
			
			//json
			opt.data = data.rows;
			opt.total = data.total;
			
			//检查是否返回了column
			if(data.columns) {
				opt.columns = data.columns;
				self.setGridHeader();
			}
		},
		onLoadError : function(msg,errorBack,xmlHttp){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			self.showLoading(msg);
			setTimeout(function(){
				self.hideLoading();	
				self.refreshDataCache();
			},2000);
		},
		//获取ajax返回的data数据
		getGridData : function(successBack,errorBack,async){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			
			var successBack = successBack || $.noop;
			var errorBack = errorBack || $.noop;
			
			var render = gid+" .datagrid-view2";
			
			var async = $.dataGrid._undef(async,false);	
			if(async == false) {
				async = self.getAsync();
			}
			
			self.methodCall('getGridData');
			
			if(async) {
				//本地数据都会存储到source 只有显示部分才会放到data里 远程数据就都放在data 不会存放到source
				opt.cacheData['source'] = opt.cacheData['source'] || opt.data;
				
				self.fireEvent('onSetPk',self, [opt.cacheData['source']]);
				
				if(opt.sortName != '') {
					opt.cacheData['source'] = self.sortData();		
				}
				
				opt.total = opt.cacheData['source'].length;
				
				var start = (opt.pageNumber-1) * opt.pageSize;
				var end = opt.pageSize * opt.pageNumber;
				end = end>opt.total ? opt.total : end;
				var data = [];
				for(var i = start;i<end;i++){
					if( opt.cacheData['source'][i] )
						data.push(opt.cacheData['source'][i]);
				}
				opt.data = data;
				successBack.call(self,render);
				
				return;	
			}
			//ajax部分
			opt.queryParams.pageNumber = opt.pageNumber;
			opt.queryParams.pageSize = opt.pageSize;
			if(opt.sortName != '') {
				//opt.queryParams.sortName = opt.sortName;
				opt.queryParams.sortName = self.getColumnData(opt.sortName,'index');
				opt.queryParams.sortOrder = opt.sortOrder;
			}
			var e = self.configs.events;
			
				$.ajax({
					url : opt.url,
					type : opt.method,
					cache : opt.cache,
					dataType : opt.dataType,
					data : opt.queryParams,
					beforeSend : function(){
						//e.onBeforeLoad.call(self);
						self.fireEvent('onBeforeLoad',self,[opt.queryParams]);
						self.showLoading();	
					},
					success : function(data){
						
						self.hideLoading();
						//opt.data = data.rows;
//						opt.total = data.total;
//						
//						//检查是否返回了column
//						if(data.columns) {
//							opt.columns = data.columns;
//							self.setGridHeader();
//						}
						//e.onLoadSuccess.call(self,data);
						self.fireEvent('onLoadSuccess',self,[data,successBack]);
						successBack.call(self,render);
					},
					error : function(xmlHttp){
						//e.onLoadError.call(self,xmlHttp.responseText);
						self.fireEvent('onLoadError',self,[xmlHttp.responseText,errorBack,xmlHttp]);
						errorBack.call(self,xmlHttp.responseText);
					}
				});	
			
		},
		setPk : function(data) {//data 必须是数组 这里是引用
			var self = this;
			var opt = self.configs;
			if(opt.pk != '') return;
			opt.pki = 1;
			opt.pk = '_pk';
			$.each(data,function(i,n){
				data[i][opt.pk] = opt.pki++;			 
			});
		},
		show : function (){
			
			var self = this;
			var opt = self.configs;
			var views = opt.views;
			var container = $("#"+opt.id);
			//防止重复调用
			if(opt.isShow) {
				return;	
			}
			opt.isShow = true;
			
			for(var i in views) {
				container.append( views[i] );	
			}
			
			self.setGrid();//必须 重新设置宽高
			self.setView();// 显示grid的容器
			self.createGrid();//gird数据显示开始...
			
			self.methodCall('show');
		}
	});
	
	$.fn._scrollLeft=function(_10){
		if(_10==undefined){
			return this.scrollLeft();

		}else{
			return this.each(function(){
				//$(this)._scrollLeft(_10);			  
				$(this).css("marginLeft",_10*-1);
			});
		}
	};
	
	$.fn._scrollTop=function(_10){
		if(_10==undefined){
			return this.scrollTop();
		}else{
			return this.each(function(){
				//$(this).scrollTop(_10);
				$(this).css("marginTop",_10*-1);
			});
		}
	};
	
	$.fn.datagrid = function(_opt){
		if(this.size()<=0){
			//alert('容器不正确');
			return false;
		}
		var list = [];
		this.each(function(i){
			var self = $(this);
			var _d = [];
			if( _opt.data ) {
				_d = _opt.data;
				_opt.data = [];
			}
			var opt = $.extend(true,{},_opt);
			
			
			opt.selector = self.selector;
			opt.helper = self;
			opt.width = $.dataGrid._undef(opt.width,self.width());
			opt.height = $.dataGrid._undef(opt.height,self.height());

			self.data('metaData',$.extend(true,{},opt,{}));	
			
			opt.data = _d;
			
			var grid = new $.dataGrid(opt);
			
			self.data('datagrid',grid);	
			
			list.push(grid);
		});
		
		if( this.size() == 1 ) {
			return this.data('datagrid');
		} else {
			return list	;
		}
	};
	$.fn.dataGrid = $.fn.datagrid;
	$.fn.extGrid = $.fn.datagrid;
	$.fn.extgrid = $.fn.datagrid;
	
	$.fn.togrid = function(cfg,_cfg){//如果url='' 只能处理简单的table比如 表头不会包含的合并之类的
		
		cfg = $.dataGrid._undef(cfg,{});
		var _cfg = $.dataGrid.getToGridOptions(_cfg);
		
		var list = [];
		
		this.each(function(i){
			$(this).css("display",'block');
			
			//table options 获取
			if( $(this).attr( _cfg.options_from ) ) {
				var opt = "{"+ $(this).attr( _cfg.options_from ) +"}";
				opt = eval("("+opt+")");
			} else {
				var opt = {};	
			}
			
			var wh = {
					width : $(this).outerWidth(),
					height : $(this).outerHeight(),
					title : $(this).attr("title")
				};
			
			var columns = [];
			
			if( !$(this).find(_cfg.columns_from).size() ) {
				_cfg.columns_from = 'tr:first-child td,tr:first-child th';
			}
			
			var thead = $(this).find(_cfg.columns_from);
			var avg_w = 0;
			if( cfg.border !== false || opt.border !== false ) {
				avg_w = 2/thead.size();//本来应该要减去平均值的 还是直接在下面-1得了
			}
			thead.each(function(i){
				//忽略 ignore 的 th td
				if( $(this).attr("ignore") != undefined ) {
					return;	
				}
				//column options 获取
				if( $(this).attr( 'field' ) ){
					var column_a = {field:$(this).attr( 'field' )};	
				} else {
					var column_a = {};	
				}
				if( $(this).attr( _cfg.options_from ) ) {
					var column_b = "{"+$(this).attr( _cfg.options_from )+"}";	
					column_b = eval("("+ column_b +")");
				} else {
					var column_b = {};	
				}
				var column = $.extend({},column_b,column_a);
				column.title = $(this).html();
				column.field = column.field ? column.field : "field_"+(Math.random() * 99999);
				column.width = column.width ? column.width : $(this).outerWidth()- 1 - 1;
				//column.width -= $.dataGrid.padding;
				if( $(this).attr('align') ) {
					column.align = $(this).attr('align') ;
				}
				if( column.field == "ck") {//系统字段
					opt.checkBox = 	true;
				}
				if( column.field == "ed") {//系统字段
					wh.editColumn = true;
				}
				columns.push(column);
			});
			$(this).find(_cfg.columns_from).parent("tr").remove();
			
			if( !$(this).find(_cfg.data_from).size() ) {
				_cfg.data_from = 'tr';
			}
			
			opt.columns = columns;
			opt = $.extend(true,wh,opt,cfg);
			//判断data数据的来源
			if(!opt.url) {//获取表格数据
				var data = [];
				$(this).find( _cfg.data_from ).each(function(i){
					var _d = {};
					$(this).find(">td,>th").each(function(i){
						var data = $(this).html();
						if( !$(this).attr("field") ) {
							if( opt.columns[i]['field'] )
								_d[ opt.columns[i]['field'] ] = data;
						} else {
							_d[ $(this).attr("field") ] = data;	
						}
					});
					data.push(_d);		
				});
				
				opt.data = data;
			}
			
			opt.helper = $("<div id='"+ ($(this).attr('id') ? $(this).attr('id') : '')+"' class='datagrid "+ $(this).attr('class') +"'></div>");
			
			$(this).after(opt.helper).remove();
			
			var grid = new $.dataGrid(opt);
			
			opt.helper.data('metaData',opt);	
			opt.helper.data("datagrid",grid);
			
			list.push(grid);
		});
		
		if( this.size() == 1 ) {
			return list[0];
		} else {
			return list	;
		}
	};
	$.fn.toGrid = $.fn.togrid;
	//resizeable
	$.fn._resize = function(opt){
		var opt = opt || {};
		var opt = $.extend({},opt);
		
		var self = this;
		function start(e,opt) {
			$(document.body).css("cursor", "col-resize");
			$(document.body).css("-moz-user-select", "none");
			$(document.body).attr("unselectable", "on");
			opt.gheader.find(".datagrid-header-inner").css("cursor", "col-resize");
			opt.gheader.find("div.datagrid-cell").css("cursor", "col-resize");
			
			var line = $("<div class='datagrid-resize'></div>");
			var render = "#view_"+opt.id;
			$(render).append(line);
			var left = $(this).offset().left - $(render).offset().left;
			var height = $(render).height();
			var width = $(this).width();
			left = parseFloat(left)+parseFloat(width);
			line.css({
				position:'absolute',
				'top':0,
				'zIndex':9999,
				'height':parseFloat(height),
				'left':left
			});
			opt.line = line;
			opt.x = e.clientX;
			opt.left = left;
			
			opt.offsetX = 0;
			
			$(document.body).bind("selectstart", function(e){
				return false;
			});
			
			$(document).bind("mousemove", function(e){
				//var r = opt.events.onResizeColumn(e,opt);
				var r = opt.self.fireEvent('onResizeColumn',opt.self,[opt,e]);
				if(r === false) return;
				resize(e,opt);
			});
			$(document).bind("mouseup", function(e){
				var r = opt.stop(e,opt);
				//if(r === false) return;
				stop(e,opt);
			});
		}
		function resize(e,opt){
			
			var x = e.clientX;
			var left = opt.left + (x - opt.x);
			opt.offsetX = (x - opt.x);
			opt.line.css({
				'left':left
			});
		}
		function stop(e,opt){
			//opt.self.resizing = false;
			var render = "#view_"+opt.id;
			$(document)	.unbind("mousemove");
			$(document)	.unbind("mouseup");
			
			$(document.body).unbind("selectstart");
			
			$(document.body).css("cursor",'default');
			$(document.body).removeAttr("unselectable");
			
			opt.gheader.find(".datagrid-header-inner").css("cursor", "default");
			opt.gheader.find("div.datagrid-cell").css("cursor", "default");
			
			$(opt.line).remove();
		}
		self.each(function(idx){
			$("<div class='datagrid_resize'></div>")
				.appendTo($(this).parent())
				.bind("mousedown",function(e){
					//opt.self.resizing = true;
					opt.field = $(this).parent().attr("field");
					//var r = opt.events.onResizeColumnStart.call(this,e,opt);
					var r = opt.self.fireEvent('onResizeColumnStart',opt.self,[this,opt,e]);
					if(r === false) return;
					start.call(this,e,opt);
					e.preventDefault();
					e.stopPropagation();
				});
		});
	};
	$.fn.moveColumn = function(opt) {
		var columns = this;
		var moving = false;
		columns.bind("mousedown.move",function(e){
			var self = this;
			var _t = setTimeout(function(){
				start.call(self,e);							 
			},opt.moveColumnTm);
			$(document.body).bind("mouseup.wt",function(e){
				clearTimeout(_t);
				$(document.body).unbind("mouseup.wt");
			});	
			e.preventDefault();
			e.stopPropagation();
		});
		columns.bind("mousemove.h",function(e){
			if(moving == false) return;
			var p = $("#"+opt.id).offset();
			var pt = p.top;
			var pl = p.left;
			
			var w = $(this).outerWidth();
			var h = $(this).height() - 2;
			
			var wt = $(this).offset().top - pt;
			var w1 = $(this).offset().left - pl - 2;
			
			var w2 = e.pageX;
			var w3 = w2 - $(this).offset().left;
			
			opt.moveToField = $(this).attr("field");
			
			var r = opt.self.fireEvent("onColumnMoving",opt.self,[opt]);
			if(r === false) {
				return;	
			}
			

			
			if( w3<=w/2 ) {
				$("#"+opt.id+"_line").css({
					left : w1,
					top : wt,
					height : h
				});
			opt.moveToFieldPos = 1;
				//console.log("前面");
			} else {
				$("#"+opt.id+"_line").css({
					left : w1 + w,
					top : wt,
					height : h
				});
			opt.moveToFieldPos = 0;
				//console.log("后面");
			}
		});
		function start(e) {
			moving = true;
			
			opt.moveField = $(this).attr("field");
			
			var _target = $('<div class="column-move" id="'+opt.id+'_move" style="position:absolute;z-index:9999;">'+$(".datagrid-cell",this).html()+'</div>').appendTo("#"+opt.id);
			var line = $('<div class="column-move-line" id="'+opt.id+'_line" style="position:absolute;height:'+$(this).outerHeight()+'px;"></div>').appendTo("#"+opt.id);
			var pos = $("#"+opt.id).offset();
			_target.css({
				left : e.pageX - pos.left + 10,
				top : e.pageY- pos.top + 10
			 });
			$(document.body).bind("mousemove.move",function(e){
			 	 _target.css({
					left : e.pageX - pos.left + 10,
					top : e.pageY- pos.top + 10
				 });
				e.preventDefault();
				e.stopPropagation();
			});	
			$(document.body).bind("mouseup.move",function(e){
				moving = false;
				_target.remove();
				line.remove();
				$(document.body).unbind("mousemove.move mouseup.move");
				opt.self.fireEvent("onColumnMove",opt.self,[opt]);
				e.preventDefault();
				e.stopPropagation();
			});
		}
	};
})(jQuery);