package com.easy.service.impl;

import java.math.BigDecimal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.easy.mapper.UserMapper;
import com.easy.service.UserService;
@Service
public class UserServiceImpl implements UserService{
	private static final Logger loger = LoggerFactory.getLogger(UserServiceImpl.class);
	
	
	@Override
	public String getUserIntId(String userId, String passwd) {
		// TODO Auto-generated method stub
		return null;
	}


	@Override
	public boolean resetUserPassword(String userId, String mobile) {
		// TODO Auto-generated method stub
		return false;
	}


	@Override
	public boolean changeUserPassword(String userId, String oldPwd, String newPwd) {
		// TODO Auto-generated method stub
		return false;
	}


	@Override
	public boolean changeCardPassword(String intUserId, String cardNo, String oldPwd, String newPwd) {
		// TODO Auto-generated method stub
		return false;
	}


	@Override
	public BigDecimal getFeeRate(String intUserId) {
		// TODO Auto-generated method stub
		return null;
	}


	@Override
	public String getCardNo(String intUserId) {
		// TODO Auto-generated method stub
		return null;
	}


	@Autowired
	private UserMapper userMapper;
}
