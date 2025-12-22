import { useMemo, useState } from 'react'
import './app.css'

type Mode = 'login' | 'register'

type StrengthLevel = 'weak' | 'medium' | 'strong'

function App() {
  const [mode, setMode] = useState<Mode>('login')
  const [password, setPassword] = useState('')
  const isLogin = mode === 'login'
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
                onClick={() => setMode('login')}
              >
                登录
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isLogin}
                className={`tab ${!isLogin ? 'active' : ''}`}
                onClick={() => setMode('register')}
              >
                注册
              </button>
            </div>

            <form
              className="form"
              onSubmit={(event) => event.preventDefault()}
            >
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
                />
              </div>

              {!isLogin && (
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
                    />
                    <button type="button" className="ghost ghost-inline">
                      获取验证码
                    </button>
                  </div>
                  <span className="hint">
                    发送至邮箱后有效期 10 分钟
                  </span>
                </div>
              )}

              <div className="field">
                <label className="field-label" htmlFor="password">
                  密码
                </label>
                <input
                  className="field-input"
                  id="password"
                  name="password"
                  type="password"
                  placeholder="至少 8 位字符"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
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
              </div>

              {!isLogin && (
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

              <button type="submit" className="primary">
                {isLogin ? '登录' : '创建账号'}
              </button>

              <div className="divider">
                <span>个人邮箱即可使用</span>
              </div>

              <button type="button" className="ghost">
                {isLogin ? '使用邮箱验证码登录' : '已有账号，直接登录'}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
