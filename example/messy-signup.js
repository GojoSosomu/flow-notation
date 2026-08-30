// ============================================================
// A small "user signup + welcome email" system, written the way
// this kind of thing actually accretes over a few sprints.
// NOT engineered to demonstrate any particular theorem.
// ============================================================

class UserRepository {
  #users = new Map();

  save(user) {
    this.#users.set(user.id, user);
  }

  findById(id) {
    return this.#users.get(id);
  }

  findByEmail(email) {
    for (const u of this.#users.values()) {
      if (u.email === email) return u;
    }
    return null;
  }

  count() {
    return this.#users.size;
  }

  // added months later for an admin dashboard that got cancelled;
  // nobody removed it
  getAllEmails() {
    return [...this.#users.values()].map(u => u.email);
  }
}

class EmailService {
  constructor(templateEngine) {
    this.templateEngine = templateEngine;
  }

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
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v);
    }
    return text;
  }
}

class SignupValidator {
  constructor(userRepository) {
    // pulled in during a bug fix: needed to check for duplicate emails
    this.userRepository = userRepository;
  }

  validate(input) {
    if (!input.email || !input.email.includes("@")) {
      throw new Error("invalid email");
    }
    if (!input.name || input.name.length < 2) {
      throw new Error("invalid name");
    }
    // duplicate check added later, reaches directly into the repo
    const existing = this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new Error("email already registered");
    }
    return true;
  }
}

class SignupService {
  constructor(validator, userRepository, emailService) {
    this.validator = validator;
    this.userRepository = userRepository;
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
const validator = new SignupValidator(userRepository);
const signupService = new SignupService(validator, userRepository, emailService);

signupService.signup({ name: "Ana", email: "ana@example.com" });

try {
  signupService.signup({ name: "Ana2", email: "ana@example.com" });
} catch (e) {
  console.log("Signup rejected:", e.message);
}