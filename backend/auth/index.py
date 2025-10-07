'''
Business: User registration and login API
Args: event with httpMethod, body; context with request_id
Returns: HTTP response with user data or error
'''

import json
import os
import psycopg2
from typing import Dict, Any

def escape_sql(value: str) -> str:
    """Escape single quotes for SQL safety"""
    return value.replace("'", "''")

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    action = body_data.get('action')
    username = body_data.get('username', '').strip()
    password = body_data.get('password', '')
    
    if not username or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': 'Username and password required'}),
            'isBase64Encoded': False
        }
    
    username_esc = escape_sql(username)
    password_esc = escape_sql(password)
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    cur = conn.cursor()
    
    try:
        if action == 'register':
            avatar_url = escape_sql(body_data.get('avatar_url', ''))
            bio = escape_sql(body_data.get('bio', ''))
            
            cur.execute(f"SELECT id FROM users WHERE username = '{username_esc}'")
            existing = cur.fetchone()
            
            if existing:
                return {
                    'statusCode': 409,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Username already exists'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                INSERT INTO users (username, password, avatar_url, bio, status) 
                VALUES ('{username_esc}', '{password_esc}', '{avatar_url}', '{bio}', 'online') 
                RETURNING id, username, avatar_url, bio, status, is_premium, theme
            """)
            user = cur.fetchone()
            
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
                        'is_premium': user[5],
                        'theme': user[6]
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'login':
            cur.execute(f"""
                SELECT id, username, avatar_url, bio, status, is_premium, theme 
                FROM users 
                WHERE username = '{username_esc}' AND password = '{password_esc}'
            """)
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Invalid credentials'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"UPDATE users SET status = 'online', last_seen = CURRENT_TIMESTAMP WHERE id = {user[0]}")
            
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
                        'status': 'online',
                        'is_premium': user[5],
                        'theme': user[6]
                    }
                }),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': False, 'error': 'Invalid action'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': False, 'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
