# Amenity - Prayer Community App

A modern React Native app that connects people through prayer and spiritual support, built with Expo, TypeScript, and Supabase.

## 🚀 Features

### Core Prayer Features
- ✅ **Prayer Creation** - Create prayers with AI-powered suggestions
- ✅ **Prayer Feed** - Browse and interact with community prayers
- ✅ **Prayer Details** - View full prayer details with comments and Bible study
- ✅ **Group Prayers** - Join prayer groups and participate in group prayers

### Social Features
- ✅ **User Profiles** - Complete user profiles with statistics
- ✅ **Direct Messaging** - Private conversations between users
- ✅ **Group Management** - Create and manage prayer groups
- ✅ **Search & Discovery** - Find prayers, users, and groups
- ✅ **Notifications** - Real-time notifications for interactions

### AI-Powered Features
- ✅ **Prayer Suggestions** - AI-generated prayer suggestions based on context
- ✅ **Bible Study Generation** - Personalized Bible study content
- ✅ **Scripture Recommendations** - Relevant Bible verses for prayers
- ✅ **Encouragement Messages** - AI-generated encouragement

### Advanced Features
- ✅ **Offline Support** - Offline-first architecture with sync queue
- ✅ **Settings & Privacy** - Comprehensive privacy controls
- ✅ **Support System** - Built-in support ticket system
- ✅ **Help & FAQ** - Comprehensive help center
- ✅ **Legal Compliance** - Terms of Service and Privacy Policy

## 🛠 Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Backend**: Supabase (Database, Auth, Storage)
- **State Management**: Zustand
- **Navigation**: React Navigation
- **AI Integration**: OpenAI GPT-3.5
- **Offline Sync**: Custom offline-first architecture
- **Testing**: Jest, React Native Testing Library
- **CI/CD**: GitHub Actions

## 📱 Screenshots

The app includes 50+ screens covering all major features:
- Authentication & Onboarding
- Prayer Creation & Management
- Group Features & Chat
- User Profiles & Settings
- Support & Help Systems
- Legal & Compliance

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator
- Supabase account
- OpenAI API key (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/amenity-app.git
   cd amenity-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
   ```

4. **Set up Supabase database**
   ```bash
   # Run the database setup scripts
   # See database/README.md for detailed instructions
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI
npm run test:ci
```

### Test Coverage
The project maintains 70%+ test coverage across:
- Unit tests for components
- Integration tests for services
- API mocking and testing
- Error handling and edge cases

## 🏗 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── prayer/         # Prayer-related components
│   ├── ai/             # AI-powered components
│   ├── offline/        # Offline sync components
│   └── common/         # Common UI components
├── screens/            # Screen components
│   ├── auth/           # Authentication screens
│   ├── prayer/         # Prayer screens
│   ├── groups/         # Group screens
│   ├── profile/        # Profile screens
│   ├── settings/       # Settings screens
│   ├── support/        # Support screens
│   └── legal/          # Legal screens
├── services/           # Business logic services
│   ├── aiService.ts    # AI integration
│   └── offlineSyncService.ts # Offline sync
├── store/              # State management
│   ├── auth/           # Authentication store
│   └── prayer/         # Prayer store
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── __tests__/          # Test files
```

## 🔧 Configuration

### Environment Variables
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `EXPO_PUBLIC_OPENAI_API_KEY` - OpenAI API key (optional)

### Supabase Setup
1. Create a new Supabase project
2. Run the database schema scripts
3. Set up Row Level Security policies
4. Configure authentication providers

### AI Integration
1. Get an OpenAI API key
2. Add it to your environment variables
3. AI features will work automatically
4. Fallback content is provided when AI is not configured

## 📦 Building for Production

### Android
```bash
expo build:android
```

### iOS
```bash
expo build:ios
```

### Web (if needed)
```bash
expo build:web
```

## 🚀 Deployment

The app is configured for deployment to:
- **Google Play Store** (Android)
- **Apple App Store** (iOS)
- **Expo Application Services** (EAS)

### CI/CD Pipeline
- Automated testing on every PR
- Security audits and vulnerability scanning
- Automated builds for production
- Code coverage reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Maintain 70%+ test coverage
- Follow the existing code style
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ for the prayer community
- Powered by modern React Native and Expo
- AI features powered by OpenAI
- Backend infrastructure by Supabase

## 📞 Support

For support, email support@amenity.app or create an issue in the repository.

---

**Amenity** - Connecting hearts through prayer 🙏
