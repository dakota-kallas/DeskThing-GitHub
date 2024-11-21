# DeskThing-GitHub

The GitHub app for DeskThing offers seamless management of repositories, pull requests, and issues, helping you stay organized and focused with real-time updates.

![GitHub]()

## Features

- **Seamless Integration**: Easily sync your GitHub account with DeskThing for smooth workflow management.
- **Repository Overview**: Quickly see detailed information about your repositories including stars, forks, and issues.
- **Pull Request Management**: View, manage, and track pull requests, including open and closed ones.
- **Issue Tracking**: Access and manage open and closed issues across your repositories.

## Installation

### Prerequisites

Make sure you have the following:

- [DeskThing](https://deskthing.app/)
- [GitHub Account](https://github.com/)

### Setup

Current as of DeskThing v0.9.3

1. Download the latest release build
2. Navigate to the `Downloads > App` tab and click on `Upload App`
   - <img src="https://github.com/user-attachments/assets/7da9db21-64c5-4c55-898a-de97b9e6f1c1" height="300" />
3. Select the `github-app-v{version number}.zip` file that was downloaded
4. Navigate to the `Settings` of `GitHub`
5. Enter your desired configuration
   - Desired Refresh Interval
   - GitHub Access Token to gain API access (_See steps below for setup_)
6. Save the Settings
7. Reset your client state by navigating to the `Menu` of you **DeskThing** on your client (Car Thing)
   - The far-right button on your **Spotify Car Thing** (or press the `M` key on other clients)

#### GitHub Access Token

You'll need to set up a GitHub Access Token on your [GitHub Account](https://github.com/)

1. Login to your [GitHub Account](https://github.com/)
2. Navigate to `Settings`
3. Navigate to `Developer Settings`
   - Should be at the bottom of the Tab list on the Settings page
4. Navigate to `Personal access tokens > Tokens (classic)`
5. Click `Generate new token`
6. Select `Generate new token (classic)`
7. Give your Token a name
   - I'd recommend using `DeskThing`
8. Set an Expiration Time
   - If you don't want to have to redo this process every X amount of days, I'd set this to `No expiration`
9. Check `repo`
   - This should check `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, and `security_events`
   - This is needed in order to see your private, starred, & public repositories
10. Check all `read:` permissions
    - The GitHub app for DeskThing does not require or use any write permissions
11. Click `Generate token`
12. Cope/Paste the newly generated Token into your DeskThing `GitHub` Settings
    - I'd recommend saving this Token somewhere else as well, you won't be able to view it again after closing the window

## Usage

1. Upon starting the loading that app onto your DeskThing, you should get a view of all things sports!
   - Navigate to `Settings` to enter your desired configuration.
2. The app will fetch the data for your:
   - User Account
   - Repositories
   - Starred Repositories
3. The data will be automatically updated based on your configuration.

## Troubleshooting

### Pull Requests and/or Issues are not loading

1. Depending on how many Issues / Pull Requests there are to pull back, it may take a couple seconds to retreieve the data

### Data not refreshing / loading

1. Check you've properly configured your `Refresh Interval` in the `Settings` page for **GitHub**
2. If you that doesn't work, refer to `Step 7` of the **Setup**
3. If you are still experiencing issues, try reducing your Refresh Interval (in `Settings`).
   - You may be hitting an API limit. You may need to wait up to 1 hour to notice a difference.

## Contributing

Create a pull request and described the added / modified functionality.

## Additional Screenshots

<img src="" height="400" />
