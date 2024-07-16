#!/bin/bash
# Grant execute permission to the script
chmod +x "$0"

# Define your repository URL
REPO_URL="https://github.com/Clicking-Studio/Mechamod_Backend.git"
# Path to your local repository
LOCAL_REPO_PATH="/home/ec2-user/Mechamod_Backend"

# Name of the branch you want to monitor
BRANCH_NAME="main"

# Function to check if new commits are available in the specified branch
check_for_new_commits() {
    # Move to the local repository directory
    cd "$LOCAL_REPO_PATH" || exit

    # Fetch latest changes from the remote repository
    git fetch origin

    # Check if there are new commits in the specified branch
    LOCAL_HASH=$(git rev-parse "$BRANCH_NAME")
    REMOTE_HASH=$(git rev-parse "origin/$BRANCH_NAME")

    if [ "$LOCAL_HASH" != "$REMOTE_HASH" ]; then
        echo "New commits detected in $BRANCH_NAME branch"
        return 0
    else
        echo "No new commits in $BRANCH_NAME branch"
        return 1
    fi
}

# Function to fetch latest code and restart pm2
fetch_and_restart_pm2() {
    # Move to the local repository directory
    cd "$LOCAL_REPO_PATH" || exit

    # Pull latest changes from the specified branch
    git pull origin "$BRANCH_NAME"

    # Restart pm2
    pm2 restart 0
}

# Main function
main() {
    if check_for_new_commits; then
        fetch_and_restart_pm2
    else
        echo "No action required."
    fi
}

# Execute the main function
main
