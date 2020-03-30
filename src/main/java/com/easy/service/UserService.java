package com.easy.service;

import java.math.BigDecimal;

public interface UserService {
	
	/***
	 * 获取用户int_user_id值
	 * 
	 * @param userId	用户编号
	 * @param passwd	密码
	 * @return
	 */
	public String getUserIntId(String userId,String passwd);
	
	/***
	 * 重置用户密码
	 * 
	 * @param userId	用户编号
	 * @param mobile	注册手机号
	 * @return			true:成功/false:失败
	 */
	public boolean resetUserPassword(String userId,String mobile);
	
	/***
	 * 修改用户密码
	 * 
	 * @param userId	用户编号
	 * @param oldPwd	旧密码
	 * @param newPwd	新密码
	 * @return			true:成功/false:失败
	 */
	public boolean changeUserPassword(String userId,String oldPwd,String newPwd);
	
	/***
	 * 修改卡密码
	 * 
	 * @param intUserId	用户int编号
	 * @param cardNo	卡号
	 * @param oldPwd	旧密码
	 * @param newPwd	新密码
	 * @return			true:成功/false:失败
	 */
	public boolean changeCardPassword(String intUserId, String cardNo,String oldPwd,String newPwd);
	
	/***
	 * 获取用户手续费
	 * 
	 * @param userId	用户编号
	 * @return
	 */
	public BigDecimal getFeeRate(String intUserId);
	
	/***
	 * 获取卡号
	 * 
	 * @param intUserId	用户int编号
	 * @return
	 */
	public String getCardNo(String intUserId);
}
