// ============================================================
// STEP 0 APPLIED PROPERLY, RETROACTIVELY.
// The real problem wasn't the edge shape -- it was that
// SignupValidator's name hid two responsibilities:
//   1. InputShapeValidator -- pure syntax checks, no dependencies
//   2. UniquenessChecker -- a genuine data check, depends on storage
// Splitting them by responsibility resolves the skip-level
// violation as a SIDE EFFECT of correct naming, not as a patch.
// ============================================================

class UserRepository {
  #users = new Map();
  save(user) { this.#users.set(user.id, user); }
  findByEmail(email) {
    for (const u of this.#users.values()) if (u.email === email) return u;
    return null;
  }
  count() { return this.#users.size; }
}

class EmailService {
  constructor(templateEngine) { this.templateEngine = templateEngine; }
  send(toEmail, subject, body) {
    console.log(`--- EMAIL to ${toEmail} ---`);
    console.log(`Subject: ${subject}`);
    console.log(body);
  }
  sendWelcome(user) {
    const body = this.templateEngine.render("welcome", { name: user.name });
    this.send(user.email, "Welcome!", body);
  }
}

class TemplateEngine {
  render(templateName, vars) {
    const templates = { welcome: `Hi {name}, welcome aboard!` };
    let text = templates[templateName] || "";
    for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, v);
    return text;
  }
}

// Responsibility 1: pure input-shape validation. No dependencies at all.
class InputShapeValidator {
  validate(input) {
    if (!input.email || !input.email.includes("@")) throw new Error("invalid email");
    if (!input.name || input.name.length < 2) throw new Error("invalid name");
    return true;
  }
}

// Responsibility 2: uniqueness check. Genuinely depends on UserRepository --
// this is now an honest, single-purpose Node, not a hidden second job
// bolted onto a validator.
class UniquenessChecker {
  constructor(userRepository) {
    this.userRepository = userRepository; // UniquenessChecker -> UserRepository (single, honest edge)
  }
  isTaken(email) {
    return this.userRepository.findByEmail(email) !== null;
  }
}

class SignupService {
  constructor(shapeValidator, uniquenessChecker, userRepository, emailService) {
    this.shapeValidator = shapeValidator;
    this.uniquenessChecker = uniquenessChecker;
    this.userRepository = userRepository;
    this.emailService = emailService;
  }
  signup(input) {
    this.shapeValidator.validate(input);
    if (this.uniquenessChecker.isTaken(input.email)) {
      throw new Error("email already registered");
    }
    const user = { id: String(this.userRepository.count() + 1), name: input.name, email: input.email };
    this.userRepository.save(user);
    this.emailService.sendWelcome(user);
    return user;
  }
}

// --- wiring ---
const templateEngine = new TemplateEngine();
const userRepository = new UserRepository();
const emailService = new EmailService(templateEngine);
const shapeValidator = new InputShapeValidator();
const uniquenessChecker = new UniquenessChecker(userRepository);
const signupService = new SignupService(shapeValidator, uniquenessChecker, userRepository, emailService);

signupService.signup({ name: "Ana", email: "ana@example.com" });
try {
  signupService.signup({ name: "Ana2", email: "ana@example.com" });
} catch (e) {
  console.log("Signup rejected:", e.message);
}