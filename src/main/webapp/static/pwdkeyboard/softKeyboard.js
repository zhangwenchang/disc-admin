/**软键盘
 * 
 * 前台覆盖keyboardId和passwordId值即可,如果页面效果有偏差,需要手动调试showKeyboardInCommon方法
 * */
jQuery.softKeyboard = {
    keyboardId: "Layer_key",
    passwordId: "billSubmitVoBillPassword",
    formId: "form1",
    afterCloseFunc: function() {if(this.formId != null && this.formId != ""){if($.formValidator != null)$.formValidator.elemIsValidNoCallBack(this.formId, this.passwordId);}},
    width:"216",
    height:"106",
    passLength:"",
    num:2,
    
    /** 显示软键盘 */

    /*普通页面密码键盘显示*/
    showKeyboardInCommon: function(str) {
    	
        if(this.keyboardId != null && this.keyboardId != ""){
        	
            obj = $("#" + this.keyboardId);
            passwordObj = $("#" + this.passwordId);
            if(obj != null){
                var top = passwordObj.offset().top - 5;           
                var left = passwordObj.offset().left + passwordObj.width() + 10;
                style = "position:absolute;visibility:visible;";
                style += "width:" + this.width + "px;";
                style += "height:" + this.height + "px;"; 
                style += "top:" + (top-30) + "px;";
                style += "left:" + (left-196) + "px;"; 
                obj.attr("style",style);               
            }
        }   
    },
    /** 模态框下密码查询软键盘 */
    showKeyboardInModal: function(str) {
    	
        if(this.keyboardId != null && this.keyboardId != ""){
        	
            obj = $("#" + this.keyboardId);
            passwordObj = $("#" + this.passwordId);
            if(obj != null){
                //var top = passwordObj.offset().top - 5;           
                //var left = passwordObj.offset().left + passwordObj.width() + 10;
                style = "position:absolute;visibility:visible;";
                style += "width:" + this.width + "px;";
                style += "height:" + this.height + "px;"; 
                style += "top:" + "10px;";
                style += "left:" + "430px;"; 
                
                obj.attr("style",style);               
            }
        }   
    },
    softKeyboardCloseCallBack:function(){
    	
    },
 
    /** 关闭软键盘 */
    closeKeyboard: function() {
        if(this.keyboardId != null && this.keyboardId != ""){
            obj = $("#" + this.keyboardId);
            if(obj != null){
                obj.attr("style","position:absolute;visibility: hidden;top: 0px;left: 0px;");
            }
            $("body").focus();
           
            $("#"+this.passwordId).blur();
            
        }
        
        //this.softKeyboardCloseCallBack();
        
        //this.afterCloseFunc();
    },
    closeKeyboard_uncheck : function() {
    	if(this.keyboardId != null && this.keyboardId != ""){
            obj = $("#" + this.keyboardId);
            if(obj != null){
                obj.attr("style","position:absolute;visibility: hidden;top: 0px;left: 0px;");
            }
            $("body").focus();
        }
    },
    /** 点击软件盘 */
    clickKeyboard: function(str) {
        passwordObj = $("#" + this.passwordId);
        if (str == "bak") {
        	var password = passwordObj.val();
           if(password.length > 0){
               passwordObj.val(password.substring(0, password.length - 1));
            }
        }else if (str == "clear"){
            passwordObj.val("");
        }else {
        	
        	if(this.passLength=="" || this.passLength ==null){
        		var pwdValue = passwordObj.val();
                if(pwdValue.length < 6){
                		passwordObj.val(pwdValue + str);
                }
                
        	}else{
        		
        		 if(passwordObj.val().length < this.passLength){
                     passwordObj.val(passwordObj.val() + str);
                 }
        	}
        }
    },
    
    keyboardCilck: function() {
        /*
        obj = $("#" + jQuery.softKeyboard.passwordId);
        if(obj != null){
            var left = obj.position().left;
            var top = obj.position().top;
            
            var right = obj.position().left + obj.width();
            var bottom = obj.position().top + obj.height();
            if( event.x < left || event.x > right 
             || event.y < top || event.y > bottom ) {
                jQuery.softKeyboard.closeKeyboard();
            }
        }
        */
     }
     
}