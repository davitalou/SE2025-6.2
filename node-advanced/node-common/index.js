// node-common/index.js
// ============================================
// Central export for shared resources
// Used by both backend and frontend
// ============================================

import config from "./config/index.js";
import { User } from "./models/User.js";
import * as mailer from "./utils/mailer.js";

// Gộp tất cả module dùng chung
export default {
  config,
  models: {
    User
  },
  utils: {
    mailer
  }
};
