"""
Business: Get users list, search users, update profile
Args: event with httpMethod, body, queryStringParameters; context with request_id
Returns: HTTP response with users data
"""

import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            search = params.get('search', '').strip()
            user_id = params.get('user_id')
            
            if search:
                cur.execute("""
                    SELECT id, username, avatar_url, bio, status, last_seen, is_premium, theme
                    FROM users
                    WHERE username ILIKE %s
                    ORDER BY username
                    LIMIT 20
                """, (f'%{search}%',))
            elif user_id:
                cur.execute("""
                    SELECT id, username, avatar_url, bio, status, last_seen, is_premium, theme
                    FROM users
                    WHERE id = %s
                """, (user_id,))
            else:
                cur.execute("""
                    SELECT id, username, avatar_url, bio, status, last_seen, is_premium, theme
                    FROM users
                    ORDER BY last_seen DESC
                    LIMIT 50
                """)
            
            users = []
            for row in cur.fetchall():
                users.append({
                    'id': row[0],
                    'username': row[1],
                    'avatar_url': row[2],
                    'bio': row[3],
                    'status': row[4],
                    'last_seen': row[5].isoformat() if row[5] else None,
                    'is_premium': row[6] if len(row) > 6 else 0,
                    'theme': row[7] if len(row) > 7 else 'light'
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'users': users})
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            user_id = body_data.get('user_id')
            
            if action == 'update_profile':
                avatar_url = body_data.get('avatar_url')
                bio = body_data.get('bio')
                
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'user_id required'})
                    }
                
                cur.execute("""
                    UPDATE users 
                    SET avatar_url = %s, bio = %s
                    WHERE id = %s
                    RETURNING id, username, avatar_url, bio, status, is_premium, theme
                """, (avatar_url, bio, user_id))
                
                user = cur.fetchone()
                conn.commit()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User not found'})
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'user': {
                            'id': user[0],
                            'username': user[1],
                            'avatar_url': user[2],
                            'bio': user[3],
                            'status': user[4],
                            'is_premium': user[5] if len(user) > 5 else 0,
                            'theme': user[6] if len(user) > 6 else 'light'
                        }
                    })
                }
            
            elif action == 'report_user':
                reporter_id = body_data.get('reporter_id')
                reported_user_id = body_data.get('reported_user_id')
                reason = body_data.get('reason', '')
                
                cur.execute("""
                    INSERT INTO user_reports (reporter_id, reported_user_id, reason)
                    VALUES (%s, %s, %s)
                """, (reporter_id, reported_user_id, reason))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'update_status':
                status = body_data.get('status', 'offline')
                cur.execute(
                    "UPDATE users SET status = %s, last_seen = CURRENT_TIMESTAMP WHERE id = %s",
                    (status, user_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()