#!/bin/bash

# Add environment variables to Vercel
echo "Adding environment variables to Vercel..."

# BOT_TOKEN
echo "8374224201:AAFCWxj_PQzJsce07pqHsa06MU1C4Qu_LKg" | npx vercel env add BOT_TOKEN production

# DATABASE_URL  
echo "postgres://9e7f34b53403ce81c00ca270a84c9d613853037c52525791abf129e55007d041:sk_HG-r1wlxGb3bhnGELk76w@db.prisma.io:5432/postgres?sslmode=require" | npx vercel env add DATABASE_URL production

# TMDB_API_KEY
echo "6d52385c239b221b5bedea1303fdb23f" | npx vercel env add TMDB_API_KEY production

echo "Environment variables added successfully!"
