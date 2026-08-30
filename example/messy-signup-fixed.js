// ============================================================
// FIX: the skip-level violation was real (SignupService reached
// UserRepository both directly and via SignupValidator), and
// unlike earlier examples, BOTH edges passed the Dependency Test
// individually -- neither was a fake/hidden edge to delete.
//
// The correct fix: SignupService should not construct the User
// object and call save() itself while ALSO handing UserRepository
// to Validator for a completely separate reason. Instead, give
// SignupService a single, mediated path: it talks to UserRepository
// only for the concerns that are genuinely its own (persisting the
// final user), and hands validator everything it needs without
// SignupService also being the one to decide uniqueness policy.
//
// Since SignupService's need (save/count) and Validator's need
// (uniqueness check) are both real and distinct, they cannot be
// collapsed into one edge. The Axiom-2-compliant fix is to make
// UserRepository's role explicit as a shared collaborator accessed
// through ONE coordinating path: SignupService owns the
// UserRepository relationship, and passes only what Validator
// needs (a duplicate-check capability) rather than the whole
// repository object -- shrinking Validator's dependency from
// "the whole UserRepository" down to just the one function it uses.
// ============================================================

class UserRepository {
  #users = new Map();
  save(user) { this.#users.set(user.id, user); }
  findById(id) { return this.#users.get(id); }
  findByEmail(email) {
    for (const u of this.#users.values()) {
      if (u.email === email) return u;
    }
    return null;
  }
  count() { return this.#users.size; }
  getAllEmails() { return [...this.#users.values()].map(u => u.email); } // still dead (Theorem 5), separate issue
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
    const templates = {
      welcome: `Hi {name}, welcome aboard!`,
      passwordReset: `Hi {name}, click here to reset your password.`,
    };
    let text = templates[templateName] || "";
    for (const [k, v] of Object.entries(vars)) text = text.replace(`{${k}}`, v);
    return text;
  }
}

// Validator no longer depends on the whole UserRepository --
// only on a plain function it needs: "does this email already exist".
class SignupValidator {
  constructor(isEmailTaken) {
    this.isEmailTaken = isEmailTaken; // a VALUE (function), not a Node reference
  }
  validate(input) {
    if (!input.email || !input.email.includes("@")) throw new Error("invalid email");
    if (!input.name || input.name.length < 2) throw new Error("invalid name");
    if (this.isEmailTaken(input.email)) throw new Error("email already registered");
    return true;
  }
}

class SignupService {
  constructor(validator, userRepository, emailService) {
    this.validator = validator;
    this.userRepository = userRepository; // the ONLY real edge to UserRepository now
    this.emailService = emailService;
  }
  signup(input) {
    this.validator.validate(input);
    const user = {
      id: String(this.userRepository.count() + 1),
      name: input.name,
      email: input.email,
    };
    this.userRepository.save(user);
    this.emailService.sendWelcome(user);
    return user;
  }
}

// --- wiring ---
const templateEngine = new TemplateEngine();
const userRepository = new UserRepository();
const emailService = new EmailService(templateEngine);
// SignupValidator now receives a bound function, not the UserRepository Node itself.
const validator = new SignupValidator(email => userRepository.findByEmail(email) !== null);
const signupService = new SignupService(validator, userRepository, emailService);

signupService.signup({ name: "Ana", email: "ana@example.com" });
try {
  signupService.signup({ name: "Ana2", email: "ana@example.com" });
} catch (e) {
  console.log("Signup rejected:", e.message);
}