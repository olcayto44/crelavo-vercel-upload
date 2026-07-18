-- Welcome assistant credits should be one-time per new user/email.
-- Do not block different users on the same shared office/home/VPN IP.
drop index if exists welcome_credit_claims_ip_address_key;
