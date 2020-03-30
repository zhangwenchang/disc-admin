package com.easy.mapper;

import java.math.BigDecimal;

import org.apache.ibatis.annotations.Param;
public interface UserMapper {
	
	/***
	 * 获取用户user_int_id属性
	 * 
	 * @param userId	用户名
	 * @param mobile	手机号
	 * @return
	 */
	public String getIntUserId(@Param("userId")String userId, @Param("mobile")String mobile);
	
	/***
	 * 获取卡号
	 * 
	 * @param userId	用户编号
	 * @return
	 */
	public String getCardNo(String intUserId);
	
	/***
	 * 获取用户手续费
	 * 
	 * @param userId	用户编号
	 * @return
	 */
	public BigDecimal getFeeRate(String intUserId);
} 
