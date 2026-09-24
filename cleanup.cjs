const fs = require('node:fs');
const root = 'frontend/src/';
const read = path => fs.readFileSync(root + path, 'utf8').replace(/\r\n/g, '\n');
const write = (path, text) => fs.writeFileSync(root + path, text);

let app = read('App.tsx');
const imports = app.slice(0, app.indexOf('type Page'));
write('App.tsx', imports + `const pagePaths = {
  landing: "/",
  login: "/login",
  signup: "/signup",
  exercise: "/exercise",
  dashboard: "/dashboard",
  places: "/places",
  favorites: "/favorites",
} as const;

type Page = keyof typeof pagePaths;
type User = { email: string; name?: string };

function getInitialPage(): Page {
  const path = window.location.pathname.replace(/\\/+$/, "") || "/";
  return (Object.keys(pagePaths) as Page[]).find(
    (page) => pagePaths[page] === path,
  ) ?? "landing";
}

export default function App() {
  const [page, setPage] = useState<Page>(getInitialPage);
  const [user, setUser] = useState<User | null>(null);

  const navigate = (nextPage: Page) => {
    window.history.pushState({}, "", pagePaths[nextPage]);
    setPage(nextPage);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    navigate("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    navigate("landing");
  };

  switch (page) {
    case "login":
      return (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onNavigateSignup={() => navigate("signup")}
        />
      );
    case "signup":
      return <Signup onNavigateLogin={() => navigate("login")} />;
    case "exercise":
      return <ExerciseInfo />;
    case "dashboard":
      return <Dashboard user={user} onLogout={handleLogout} />;
    case "places":
      return <NearbyPlaces />;
    case "favorites":
      return <Favorites />;
    default:
      return (
        <Landing
          onNavigateLogin={() => navigate("login")}
          onNavigateSignup={() => navigate("signup")}
          onNavigatePage={navigate}
        />
      );
  }
}
`);

let signup = read('pages/Signup.tsx');
signup = signup.replace('  const [allAgree, setAllAgree] = useState(false);\n', '');
signup = signup.replaceAll('agree1', 'agreeTerms').replaceAll('setAgree1', 'setAgreeTerms');
signup = signup.replaceAll('agree2', 'agreePrivacy').replaceAll('setAgree2', 'setAgreePrivacy');
signup = signup.replace('  const handleAllAgree', '  const allAgree = agreeTerms && agreePrivacy;\n\n  const handleAllAgree');
signup = signup.replace('    setAllAgree(checked);\n', '');
signup = signup.replace(/  const handleIndividual[\s\S]*?\n  };\n\n/, '');
signup = signup.replace('handleIndividual(1, e.target.checked)', 'setAgreeTerms(e.target.checked)');
signup = signup.replace('handleIndividual(2, e.target.checked)', 'setAgreePrivacy(e.target.checked)');
signup = signup.replace('agreeTerms: agreeTerms, agreePrivacy: agreePrivacy', 'agreeTerms, agreePrivacy');
signup = signup.replace('function Signup(', 'export default function Signup(').replace('\nexport default Signup;\n', '');
signup = signup.replace('    }\n    finally { setSubmitting(false); }', '    } finally {\n      setSubmitting(false);\n    }');
write('pages/Signup.tsx', signup);

let login = read('pages/Login.tsx');
login = login.replace(/\/\*\*[\s\S]*?\*\/\n\n/, '');
login = login.replace(/\{\/\*\n\s*카카오 로그인:[\s\S]*?\*\/\}/, '{/* 카카오 로그인 연동 전까지 비활성화 */}');
login = login.replace("    const nextErrors = { email: '', password: '' }", '    const nextErrors = { ...initialErrors }');
write('pages/Login.tsx', login);

let landing = read('pages/Landing.tsx');
const cards = [...landing.matchAll(/<article\s+className="feature-card"[\s\S]*?<\/article>/g)];
if (cards.length !== 5) throw new Error('Expected five feature cards');
const features = cards.map(([card]) => ({
  page: card.match(/onNavigatePage\("(\w+)"\)/)[1],
  iconClass: card.match(/className="feature-icon (\w+)"/)[1],
  icon: card.match(/<span>(.*?)<\/span>/)[1],
  title: card.match(/<h3>\s*([\s\S]*?)\s*<\/h3>/)[1],
  description: card.match(/<p>\s*([\s\S]*?)\s*<\/p>/)[1].replace(/\s+/g, ' '),
}));
landing = landing.replace('export default function Landing', 'const features = ' + JSON.stringify(features, null, 2) + ' as const;\n\nexport default function Landing');
const start = landing.indexOf('            <div className="feature-grid">');
const end = landing.indexOf('\n            </div>', start) + '\n            </div>'.length;
landing = landing.slice(0, start) + `            <div className="feature-grid">
              {features.map((feature) => (
                <article
                  key={feature.iconClass}
                  className="feature-card"
                  onClick={() => onNavigatePage(feature.page)}
                >
                  <div className={\`feature-icon \${feature.iconClass}\`}>
                    <span>{feature.icon}</span>
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <button type="button" className="feature-link">
                    자세히 보기 →
                  </button>
                </article>
              ))}
            </div>` + landing.slice(end);
write('pages/Landing.tsx', landing);

// Keep JSX text whitespace intact; only remove excessive blank lines and compact single-line children.
for (const path of ['pages/Landing.tsx', 'pages/Signup.tsx']) {
  let text = read(path).replace(/\n[ \t]*\n/g, '\n');
  text = text.replace(/(<(\w+)(?: [^<>\n]*)?>)\n\s*([^<>\n]+?)\n\s*(<\/\2>)/g,
    (_, open, tag, content, close) => open + content.trim() + close);
  write(path, text);
}

const sass = require('./frontend/node_modules/sass');
for (const path of ['App.scss', 'index.scss', 'pages/Signup.scss']) {
  const original = read(path);
  const before = sass.compileString(original, { style: 'compressed' }).css;
  let text = original.replace(/\/\* =+\n\s*(.*?)\n=+ \*\//g, '/* $1 */');
  text = text.replace(/^( +)/gm, (indent) => path === 'pages/Signup.scss' ? indent : ' '.repeat(indent.length / 2));
  text = text.replace(/([^;{}\s])\n(\s*})/g, '$1;\n$2');
  text = text.replace(/@media\(/g, '@media (').replace(/(min-width|max-width|prefers-reduced-motion):(?=\S)/g, '$1: ');
  const after = sass.compileString(text, { style: 'compressed' }).css;
  if (before !== after) throw new Error('CSS output changed: ' + path);
  write(path, text);
  console.log(path + ': compiled CSS unchanged');
}
