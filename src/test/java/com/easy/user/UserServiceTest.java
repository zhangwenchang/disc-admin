package com.easy.user;

import java.math.BigDecimal;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.easy.service.UserService;
/**
 * 用户操作测试
 * 
 * @auth 张文昌
 * @date 2014-2-26
 * @action create
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:admin-context-test.xml")
public class UserServiceTest{
	
	/***
	 *登录时获取int_user_id属性
	 */
	@Test
	public void getUserIntId(){
		String userId = "ruidev";
//		String passWord = "123456";//正确密码
		String passWord = "";//错误密码
		//String userIntId = userService.getUserIntId(userId,passWord);
		//System.out.println("userIntId = " + userIntId);
	}
	
	
	@Autowired
	private UserService userService;
}
