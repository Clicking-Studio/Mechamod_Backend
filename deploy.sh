#!/bin/bash

# Replace these variables with your specific details
INSTANCE_IP="3.142.172.85"        # Public IP or DNS of your EC2 instance
SSH_KEY="/home/ec2-user/mechamod_backend/Mechamod_Backend/backend.pem"   # Path to your SSH key pair (.pem file)
APP_DIR="/home/ec2-user/mechamod_backend/Mechamod_Backend"    # Directory path of your Node.js application on EC2
PM2_APP_NAME="index"           # Name of your PM2 application

# SSH command to connect and execute script on EC2 instance
ssh -i "$SSH_KEY" ec2-user@$INSTANCE_IP << EOF
    # Change directory to your Node.js application directory
    cd $APP_DIR
    
    # Pull latest changes from Git repository
    git pull origin main  # Assuming you're pulling from the 'main' branch
    
    # Install dependencies
    npm install 
    
    # Restart PM2 process
    pm2 delete $PM2_APP_NAME || true
    pm2 start npm --name $PM2_APP_NAME -- start
    
    echo "Deployment completed."
EOF
