package com.easy.web.interceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.lang.StringUtils;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;
import org.springframework.web.util.UrlPathHelper;

public class AdminContextInterceptor extends HandlerInterceptorAdapter {

	@Override
	public boolean preHandle(HttpServletRequest request,
			HttpServletResponse response, Object handler) throws Exception {
		
		if(!auth){
			// 指定管理员（开发状态）
			return true;
		}else{
			// 生产状态
			String uri = getURI(request);
			// 是否在验证的范围内
			if (exclude(uri)) {
				return true;
			}
			HttpSession session = request.getSession();
			String userId = (String)session.getAttribute("user_id");
			String intUserId = (String)session.getAttribute("int_user_id");
			// 用户未登录,跳转到登陆页面
			if (userId == null || intUserId == null) {
				String x_requested_with = request.getHeader("x-requested-with");
				if(x_requested_with != null && x_requested_with.equalsIgnoreCase("XMLHttpRequest")){
					response.addHeader("sessionstatus", "timeout");
				}else{
					session.setAttribute("istimeout",true);
					response.sendRedirect(getLoginUrl(request));
				}
				return false;
			}
		}
		return true;
	}

	@Override
	public void postHandle(HttpServletRequest request,
			HttpServletResponse response, Object handler, ModelAndView mav)
			throws Exception {
	}

	@Override
	public void afterCompletion(HttpServletRequest request,
			HttpServletResponse response, Object handler, Exception ex)
			throws Exception {
	}
	
	/***
	 * 返回不包含上下文的访问路径
	 * 
	 * @param request
	 * @return
	 * @throws IllegalStateException
	 */
	private static String getURI(HttpServletRequest request)
			throws IllegalStateException {
		
		UrlPathHelper helper = new UrlPathHelper();
		String uri = helper.getOriginatingRequestUri(request);
		String ctxPath = helper.getOriginatingContextPath(request);
		
		return uri.substring(ctxPath.length());
	}

	/***
	 * 判断访问路径是否在验证范围
	 *
	 * @param uri	不包含上下文的访问路径
	 * @return
	 */
	private boolean exclude(String uri) {
		if (excludeUrls != null) {
			for (String exc : excludeUrls) {
				int index = exc.indexOf("*");
				if(index > 0){
					exc = exc.substring(0,index);
					if (uri.indexOf(exc) >= 0) {
						return true;
					}
				}else{
					if (exc.equals(uri)) {
						return true;
					}
				}
			}
		}
		return false;
	}
	
	private boolean auth = true;//拦截器开关
	private String[] excludeUrls;//未被拦截的url集合
	private String loginUrl;//用户登录url
	public boolean isAuth() {
		return auth;
	}

	public void setAuth(boolean auth) {
		this.auth = auth;
	}

	public String[] getExcludeUrls() {
		return excludeUrls;
	}

	public void setExcludeUrls(String[] excludeUrls) {
		this.excludeUrls = excludeUrls;
	}

	public String getLoginUrl(HttpServletRequest request) {
		StringBuilder buff = new StringBuilder();
		if (loginUrl.startsWith("/")) {
			String ctx = request.getContextPath();
			if (!StringUtils.isBlank(ctx)) {
				buff.append(ctx);
			}
		}
		buff.append(loginUrl);
		return buff.toString();
	}

	public void setLoginUrl(String loginUrl) {
		this.loginUrl = loginUrl;
	}
	
}