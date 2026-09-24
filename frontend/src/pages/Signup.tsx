import { useState } from "react";
import { signup, emailAvailable } from "../api/auth";
import "./Signup.scss";

type SignupProps = {
  onNavigateLogin?: () => void;
};

export default function Signup({ onNavigateLogin }: SignupProps) {
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const allAgree = agreeTerms && agreePrivacy;

  const handleAllAgree = (checked: boolean) => {
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
  };

  const handleEmailCheck = async () => {
    try {
      const checkedEmail = email.trim();
      const { available } = await emailAvailable(checkedEmail);
      if (!available) return alert("이미 가입된 이메일입니다.");
      if (email.trim() === checkedEmail) setEmailChecked(true);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "이메일 확인에 실패했습니다.");
    }
  };
  // 회원가입 완료

  const handleSignup = async () => {
    if (!agreeTerms || !agreePrivacy) {
      alert("필수 약관에 동의해주세요.");
      return;
    }
    if (!emailChecked) {
      alert("이메일 확인을 해주세요.");
      return;
    }
    if (!name.trim() || !nickname.trim()) {
      alert("이름과 닉네임을 입력해주세요.");
      return;
    }
    if (password.length < 8) {
      alert("비밀번호는 8자 이상 입력해주세요.");
      return;
    }
    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    setSubmitting(true);
    try {
      await signup({ name, nickname, email, password, agreeTerms, agreePrivacy });
      alert("회원가입이 완료되었습니다.");
      if (onNavigateLogin) onNavigateLogin();
      else window.location.href = "/login";
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "회원가입에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-left">
          <div className="left-content">
            <div className="logo">
              <div className="logo-icon">〽</div>
              <span>FitMap</span>
            </div>
            <h1>
              운동의 시작,
              <br />
              지금 여기서부터
            </h1>
            <p className="left-description">
              FitMap과 함께 건강한 운동을 시작하세요
              <br />
              회원가입 후 내 위치 기반
              <br />
              맞춤형 운동 정보를 바로 확인하세요.
            </p>
            <div className="feature-list">
              {[
                ["⌖", "실시간 위치 기반 날씨 분석"],
                ["♧", "맞춤형 운동 정보 제공"],
                ["☆", "즐겨찾기 및 운동 기록 관리"],
              ].map(([icon, label]) => (
                <div key={label} className="feature">
                  <div className="feature-icon">{icon}</div><span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="signup-right">
          <div className="signup-form">
            <div className="form-title">
              <h2>회원가입</h2>
              <p>FitMap과 함께 건강한 운동을 시작하세요</p>
            </div>
            <div className="name-row">
              {[
                { label: "이름", icon: "♙", placeholder: "이름을 입력하세요", value: name, setValue: setName },
                { label: "닉네임", icon: "☺", placeholder: "닉네임 입력", value: nickname, setValue: setNickname },
              ].map((field) => (
                <div key={field.label} className="input-group">
                  <label>{field.label}</label>
                  <div className="input-box">
                    <span className="input-icon">{field.icon}</span>
                    <input type="text" placeholder={field.placeholder} value={field.value} onChange={(e) => field.setValue(e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
            <div className="input-group email-group">
              <label>이메일</label>
              <div className="email-box">
                <span className="input-icon">✉</span>
                <input type="email" placeholder="fitmap@example.com" value={email} onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailChecked(false);
                  }}
                />
                {!emailChecked ? (
                  <button type="button" className="email-check-button" onClick={handleEmailCheck} >
                    확인
                  </button>
                ) : (
                  <span className="email-check">✓ 확인됨</span>
                )}
              </div>
            </div>
            {[
              { label: "비밀번호", placeholder: "8자 이상 입력하세요", value: password,
                setValue: setPassword, visible: showPassword, setVisible: setShowPassword },
              { label: "비밀번호 확인", placeholder: "비밀번호를 다시 입력하세요", value: passwordConfirm,
                setValue: setPasswordConfirm, visible: showPasswordConfirm, setVisible: setShowPasswordConfirm },
            ].map((field) => (
              <div key={field.label} className="input-group">
                <label>{field.label}</label>
                <div className="input-box">
                  <span className="input-icon">▣</span>
                  <input type={field.visible ? "text" : "password"} placeholder={field.placeholder}
                    value={field.value} onChange={(e) => field.setValue(e.target.value)} />
                  <button type="button" className="eye" aria-label={field.label + " 보기"} onClick={() => field.setVisible(!field.visible)}>
                    {field.visible ? "🙈" : "👁"}
                  </button>
                </div>
              </div>
            ))}
            <div className="agree-box">
              <label className="all-agree">
                <input type="checkbox" checked={allAgree} onChange={(e) =>
                    handleAllAgree(e.target.checked)
                  }
                />
                <span className="custom-check"></span>
                <strong>전체 동의</strong>
              </label>
              {[
                { label: "이용약관 동의 (필수)", checked: agreeTerms, setChecked: setAgreeTerms },
                { label: "개인정보 처리방침 동의 (필수)", checked: agreePrivacy, setChecked: setAgreePrivacy },
              ].map((agreement) => (
                <div key={agreement.label} className="agree-line">
                  <label>
                    <input type="checkbox" checked={agreement.checked} onChange={(e) => agreement.setChecked(e.target.checked)} />
                    <span className="small-check"></span>{agreement.label}
                  </label>
                  <button type="button">보기</button>
                </div>
              ))}
              <div className="agree-line optional">
                <label>
                  <input type="checkbox" />
                  <span className="small-check"></span>
                  위치정보 수집 동의 (선택)
                </label>
                <button type="button">보기</button>
              </div>
            </div>
            <button type="button" className="signup-button" onClick={handleSignup} disabled={submitting} >
              회원가입 완료
              <span>→</span>
            </button>
            <div className="login-link">
              이미 계정이 있으신가요?
              <button type="button" onClick={onNavigateLogin} >
                로그인하기 →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
