import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CODE_COUNTDOWN_SECONDS,
  CODE_HINT_DEFAULT,
  ACCESS_TOKEN_KEY,
  EXPIRES_IN_KEY,
  REMEMBER_EMAIL_KEY,
  REFRESH_TOKEN_KEY,
} from '../../constants/auth'
import { hasAuthToken } from '../../utils/auth'
import {
  codeLogin,
  passwordLogin,
  registerUser,
  sendEmailCode,
} from '../../api/auth'

type Mode = 'login' | 'register' | 'code-login'

type StrengthLevel = 'weak' | 'medium' | 'strong'

function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeMessage, setCodeMessage] = useState('')
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [codeCountdown, setCodeCountdown] = useState(0)
  const [isCodeError, setIsCodeError] = useState(false)
  const [formMessage, setFormMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const isPasswordLogin = mode === 'login'
  const isCodeLogin = mode === 'code-login'
  const isRegister = mode === 'register'
  const isLogin = isPasswordLogin || isCodeLogin
  const hasLetter = /[A-Za-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const longEnough = password.length >= 8

  const strength = useMemo<StrengthLevel>(() => {
    if (!password) {
      return 'weak'
    }
    if (longEnough && hasLetter && hasNumber && password.length >= 12) {
      return 'strong'
    }
    if (longEnough && hasLetter && hasNumber) {
      return 'medium'
    }
    return 'weak'
  }, [hasLetter, hasNumber, longEnough, password])

  useEffect(() => {
    if (hasAuthToken()) {
      navigate('/home', { replace: true })
      return
    }

    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY)
    if (rememberedEmail) {
      setEmail(rememberedEmail)
      setRememberMe(true)
    }
  }, [navigate])

  useEffect(() => {
    if (codeCountdown <= 0) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      setCodeCountdown((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [codeCountdown])

  const handleSendCode = async () => {
    if (!email) {
      setCodeMessage('请先填写邮箱地址')
      setIsCodeError(true)
      return
    }

    try {
      setIsSendingCode(true)
      setCodeMessage('验证码发送中...')
      setIsCodeError(false)
      await sendEmailCode(email)
      setCodeMessage('验证码已发送，请查收邮箱')
      setIsCodeError(false)
      setCodeCountdown(CODE_COUNTDOWN_SECONDS)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '发送失败，请稍后重试'
      setCodeMessage(message)
      setIsCodeError(true)
    } finally {
      setIsSendingCode(false)
    }
  }

  const resetForm = () => {
    setCode('')
    setPassword('')
    setConfirmPassword('')
    setCodeMessage('')
    setFormMessage('')
    setIsCodeError(false)
    setCodeCountdown(0)
  }

  const restoreRememberedEmail = () => {
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY)
    if (rememberedEmail) {
      setEmail(rememberedEmail)
      setRememberMe(true)
    }
  }

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode)
    resetForm()
    if (nextMode !== 'register') {
      restoreRememberedEmail()
    }
  }

  const handleSwitchAuth = () => {
    handleModeChange(isPasswordLogin ? 'code-login' : 'login')
  }

  const persistTokens = (tokens: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }) => {
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
    storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
    storage.setItem(EXPIRES_IN_KEY, String(tokens.expiresIn))

    if (rememberMe) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email)
      sessionStorage.removeItem(ACCESS_TOKEN_KEY)
      sessionStorage.removeItem(REFRESH_TOKEN_KEY)
      sessionStorage.removeItem(EXPIRES_IN_KEY)
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY)
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(EXPIRES_IN_KEY)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormMessage('')

    if (isPasswordLogin) {
      if (!email || !password) {
        setFormMessage('请填写完整登录信息')
        return
      }

      try {
        setIsSubmitting(true)
        const tokens = await passwordLogin({
          username: email,
          password,
        })
        persistTokens(tokens)
        navigate('/home', { replace: true })
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : '登录失败，请稍后重试'
        setFormMessage(message)
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (isCodeLogin) {
      if (!email || !code) {
        setFormMessage('请填写邮箱验证码')
        return
      }

      try {
        setIsSubmitting(true)
        const tokens = await codeLogin({
          username: email,
          code,
        })
        persistTokens(tokens)
        navigate('/home', { replace: true })
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : '登录失败，请稍后重试'
        setFormMessage(message)
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (!email || !code || !password || !confirmPassword) {
      setFormMessage('请填写完整注册信息')
      return
    }

    try {
      setIsSubmitting(true)
      await registerUser({
        email,
        code,
        password,
        confirmPassword,
      })
      setFormMessage('注册成功，请登录')
      handleModeChange('login')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '注册失败，请稍后重试'
      setFormMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="backdrop" aria-hidden="true" />
      <main className="shell">
        <section className="auth">
          <div className="card">
            <div className="card-header">
              <div className="mark" aria-hidden="true">
                GL
              </div>
              <div className="brand-text">
                <div className="brand-title">GL Blog</div>
                <div className="brand-subtitle">个人博客后台管理</div>
              </div>
            </div>
            <div className="tabs" role="tablist" aria-label="Auth mode">
              <button
                type="button"
                role="tab"
                aria-selected={isLogin}
                className={`tab ${isLogin ? 'active' : ''}`}
                onClick={() => handleModeChange('login')}
              >
                登录
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isRegister}
                className={`tab ${isRegister ? 'active' : ''}`}
                onClick={() => handleModeChange('register')}
              >
                注册
              </button>
            </div>

            <form className="form" onSubmit={handleSubmit}>
              <div className="field">
                <label className="field-label" htmlFor="email">
                  邮箱
                </label>
                <input
                  className="field-input"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              {(isRegister || isCodeLogin) && (
                <div className="field code-field">
                  <label className="field-label" htmlFor="code">
                    邮箱验证码
                  </label>
                  <div className="code-row">
                    <input
                      className="field-input code-input"
                      id="code"
                      name="code"
                      type="text"
                      placeholder="输入 6 位验证码"
                      autoComplete="one-time-code"
                      required
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                    />
                    <button
                      type="button"
                      className="ghost ghost-inline"
                      onClick={handleSendCode}
                      disabled={isSendingCode || codeCountdown > 0}
                    >
                      {isSendingCode
                        ? '发送中...'
                        : codeCountdown > 0
                          ? `${codeCountdown}s`
                          : '获取验证码'}
                    </button>
                  </div>
                  <span
                    className={`hint ${isCodeError ? 'hint-error' : ''}`}
                  >
                    {codeMessage || CODE_HINT_DEFAULT}
                  </span>
                </div>
              )}

              {(isPasswordLogin || isRegister) && (
                <div className="field">
                  <label className="field-label" htmlFor="password">
                    密码
                  </label>
                  <input
                    className="field-input"
                    id="password"
                    name="password"
                    type="password"
                    placeholder={
                      isPasswordLogin ? '请输入密码' : '至少 8 位字符'
                    }
                    autoComplete={
                      isPasswordLogin ? 'current-password' : 'new-password'
                    }
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  {isRegister && (
                    <>
                      <div className="strength">
                        <span className={`strength-dot ${strength}`} />
                        <span className={`strength-dot ${strength}`} />
                        <span className={`strength-dot ${strength}`} />
                        <span className="strength-text">
                          密码强度：
                          {strength === 'weak'
                            ? '弱'
                            : strength === 'medium'
                              ? '中'
                              : '强'}
                        </span>
                      </div>
                      <span className="hint">
                        需至少 8 位，且包含字母与数字
                      </span>
                    </>
                  )}
                </div>
              )}

              {isRegister && (
                <div className="field">
                  <label className="field-label" htmlFor="confirm">
                    确认密码
                  </label>
                  <input
                    className="field-input"
                    id="confirm"
                    name="confirm"
                    type="password"
                    placeholder="再次输入密码"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                  />
                </div>
              )}

              <div className="row">
                {isLogin ? (
                  <>
                    <label className="checkbox">
                      <input
                        className="checkbox-input"
                        type="checkbox"
                        name="remember"
                        checked={rememberMe}
                        onChange={(event) =>
                          setRememberMe(event.target.checked)
                        }
                      />
                      记住我
                    </label>
                    <button type="button" className="link">
                      忘记密码？
                    </button>
                  </>
                ) : (
                  <label className="checkbox">
                    <input
                      className="checkbox-input"
                      type="checkbox"
                      name="terms"
                      required
                    />
                    我已阅读并同意《服务协议》与《隐私政策》
                  </label>
                )}
              </div>

              <button
                type="submit"
                className="primary"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? '提交中...'
                  : isLogin
                    ? '登录'
                    : '创建账号'}
              </button>

              {formMessage && (
                <span
                  className={`hint ${formMessage.includes('成功') ? '' : 'hint-error'}`}
                >
                  {formMessage}
                </span>
              )}

              <div className="divider">
                <span>个人邮箱即可使用</span>
              </div>

              <button
                type="button"
                className="ghost"
                onClick={handleSwitchAuth}
              >
                {isPasswordLogin
                  ? '使用邮箱验证码登录'
                  : isCodeLogin
                    ? '使用密码登录'
                    : '已有账号，直接登录'}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}

export default LoginPage
