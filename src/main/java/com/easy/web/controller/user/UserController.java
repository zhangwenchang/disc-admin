package com.easy.web.controller.user;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class UserController{
	private static final Logger loger = LoggerFactory.getLogger(UserController.class);
	
	
	@RequestMapping("/user/index")
	public String userIndex(HttpServletRequest request, HttpServletResponse response,
			ModelMap model) throws IOException {
		

		return "bill/tradeRecord";
	}
	
}
