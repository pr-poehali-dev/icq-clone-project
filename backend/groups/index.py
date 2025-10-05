"""
Business: Create groups, manage members, send group messages
Args: event with httpMethod, body, queryStringParameters; context with request_id
Returns: HTTP response with groups data
"""

import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
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
            user_id = params.get('user_id')
            group_id = params.get('group_id')
            
            if group_id:
                cur.execute("""
                    SELECT g.id, g.name, g.description, g.avatar_url, g.created_by, g.created_at,
                           u.username as creator_name
                    FROM groups g
                    JOIN users u ON g.created_by = u.id
                    WHERE g.id = %s
                """, (group_id,))
                
                row = cur.fetchone()
                if row:
                    cur.execute("""
                        SELECT u.id, u.username, u.avatar_url, gm.role
                        FROM group_members gm
                        JOIN users u ON gm.user_id = u.id
                        WHERE gm.group_id = %s
                    """, (group_id,))
                    
                    members = []
                    for m in cur.fetchall():
                        members.append({
                            'id': m[0],
                            'username': m[1],
                            'avatar_url': m[2],
                            'role': m[3]
                        })
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'group': {
                                'id': row[0],
                                'name': row[1],
                                'description': row[2],
                                'avatar_url': row[3],
                                'created_by': row[4],
                                'created_at': row[5].isoformat(),
                                'creator_name': row[6],
                                'members': members
                            }
                        })
                    }
            
            elif user_id:
                cur.execute("""
                    SELECT g.id, g.name, g.description, g.avatar_url, g.created_at,
                           (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
                    FROM groups g
                    JOIN group_members gm ON g.id = gm.group_id
                    WHERE gm.user_id = %s
                    ORDER BY g.created_at DESC
                """, (user_id,))
                
                groups = []
                for row in cur.fetchall():
                    groups.append({
                        'id': row[0],
                        'name': row[1],
                        'description': row[2],
                        'avatar_url': row[3],
                        'created_at': row[4].isoformat(),
                        'member_count': row[5]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'groups': groups})
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'create':
                name = body_data.get('name')
                description = body_data.get('description', '')
                avatar_url = body_data.get('avatar_url', '')
                created_by = body_data.get('created_by')
                
                cur.execute("""
                    INSERT INTO groups (name, description, avatar_url, created_by)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, name, description, avatar_url, created_at
                """, (name, description, avatar_url, created_by))
                
                group = cur.fetchone()
                
                cur.execute("""
                    INSERT INTO group_members (group_id, user_id, role)
                    VALUES (%s, %s, %s)
                """, (group[0], created_by, 'admin'))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'group': {
                            'id': group[0],
                            'name': group[1],
                            'description': group[2],
                            'avatar_url': group[3],
                            'created_at': group[4].isoformat()
                        }
                    })
                }
            
            elif action == 'add_member':
                group_id = body_data.get('group_id')
                user_id = body_data.get('user_id')
                
                cur.execute("""
                    INSERT INTO group_members (group_id, user_id, role)
                    VALUES (%s, %s, %s)
                """, (group_id, user_id, 'member'))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'send_message':
                group_id = body_data.get('group_id')
                sender_id = body_data.get('sender_id')
                content = body_data.get('content', '')
                file_url = body_data.get('file_url')
                file_name = body_data.get('file_name')
                
                cur.execute("""
                    INSERT INTO group_messages (group_id, sender_id, content, file_url, file_name)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, created_at
                """, (group_id, sender_id, content, file_url, file_name))
                
                result = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message_id': result[0],
                        'created_at': result[1].isoformat()
                    })
                }
            
            elif action == 'get_messages':
                group_id = body_data.get('group_id')
                
                cur.execute("""
                    SELECT gm.id, gm.sender_id, gm.content, gm.file_url, gm.file_name, 
                           gm.created_at, u.username, u.avatar_url
                    FROM group_messages gm
                    JOIN users u ON gm.sender_id = u.id
                    WHERE gm.group_id = %s
                    ORDER BY gm.created_at ASC
                """, (group_id,))
                
                messages = []
                for row in cur.fetchall():
                    messages.append({
                        'id': row[0],
                        'sender_id': row[1],
                        'content': row[2],
                        'file_url': row[3],
                        'file_name': row[4],
                        'created_at': row[5].isoformat(),
                        'sender_name': row[6],
                        'sender_avatar': row[7]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'messages': messages})
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()
