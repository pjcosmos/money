from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from config import Config
from models import db, User, Transaction, Category, Budget, Memo, Saving

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
migrate = Migrate(app, db)
bcrypt = Bcrypt(app)
CORS(app, supports_credentials=True) # supports_credentials=True is required for cookies
login_manager = LoginManager(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ================= AUTHENTICATION API =================

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': '아이디와 비밀번호는 필수입니다.'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': '이미 존재하는 아이디입니다.'}), 409

    user = User(username=username)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    
    # Also create default categories for the new user
    default_categories = {
        'income': ['월급', '용돈', '부수입'],
        'expense': ['식비', '교통', '쇼핑', '기타']
    }
    for cat_name in default_categories['income']:
        db.session.add(Category(name=cat_name, type='income', author=user))
    for cat_name in default_categories['expense']:
        db.session.add(Category(name=cat_name, type='expense', author=user))
    db.session.commit()

    return jsonify({'message': '회원가입이 완료되었습니다.'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user is None or not user.check_password(password):
        return jsonify({'error': '아이디 또는 비밀번호가 잘못되었습니다.'}), 401
    
    login_user(user, remember=True)
    return jsonify({'message': '로그인 성공', 'username': user.username}), 200

@app.route('/api/auth/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': '로그아웃 성공'}), 200

@app.route('/api/auth/me', methods=['GET'])
@login_required
def me():
    return jsonify({
        'id': current_user.id,
        'username': current_user.username
    }), 200

# ================= DATA APIs =================

# --- Categories ---
@app.route('/api/categories', methods=['GET'])
@login_required
def get_categories():
    categories = Category.query.filter_by(user_id=current_user.id).all()
    return jsonify([c.to_dict() for c in categories]), 200

@app.route('/api/categories', methods=['POST'])
@login_required
def add_category():
    data = request.get_json()
    if not data or not 'name' in data or not 'type' in data:
        return jsonify({'error': '카테고리 이름과 타입은 필수입니다.'}), 400
    
    category = Category(name=data['name'], type=data['type'], user_id=current_user.id)
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201

# --- Transactions ---
@app.route('/api/transactions', methods=['GET'])
@login_required
def get_transactions():
    transactions = Transaction.query.filter_by(user_id=current_user.id).order_by(Transaction.date.desc()).all()
    return jsonify([t.to_dict() for t in transactions]), 200

@app.route('/api/transactions', methods=['POST'])
@login_required
def add_transaction():
    data = request.get_json()
    if not all(k in data for k in ['description', 'amount', 'type', 'date', 'category_id']):
        return jsonify({'error': '모든 필드를 입력해주세요.'}), 400

    new_transaction = Transaction(
        description=data['description'],
        amount=data['amount'],
        type=data['type'],
        date=data['date'],
        category_id=data['category_id'],
        user_id=current_user.id
    )
    db.session.add(new_transaction)
    db.session.commit()
    return jsonify(new_transaction.to_dict()), 201

@app.route('/api/transactions/<int:transaction_id>', methods=['DELETE'])
@login_required
def delete_transaction(transaction_id):
    transaction = Transaction.query.get_or_404(transaction_id)
    if transaction.user_id != current_user.id:
        return jsonify({'error': '권한이 없습니다.'}), 403
    
    db.session.delete(transaction)
    db.session.commit()
    return jsonify({'message': '삭제 완료'}), 200

@app.route('/api/transactions/<int:transaction_id>', methods=['PUT'])
@login_required
def update_transaction(transaction_id):
    transaction = Transaction.query.get_or_404(transaction_id)
    if transaction.user_id != current_user.id:
        return jsonify({'error': '권한이 없습니다.'}), 403
        
    data = request.get_json()
    transaction.description = data.get('description', transaction.description)
    transaction.amount = data.get('amount', transaction.amount)
    transaction.type = data.get('type', transaction.type)
    transaction.date = data.get('date', transaction.date)
    transaction.category_id = data.get('category_id', transaction.category_id)
    db.session.commit()
    return jsonify(transaction.to_dict()), 200

# --- Budgets ---
@app.route('/api/budgets', methods=['GET'])
@login_required
def get_budgets():
    budgets = Budget.query.filter_by(user_id=current_user.id).all()
    return jsonify([b.to_dict() for b in budgets]), 200

@app.route('/api/budgets', methods=['POST'])
@login_required
def save_budgets():
    data = request.get_json() # Expects a list of budget objects
    # Simple approach: delete all budgets for the month and re-add them
    if data and isinstance(data, list) and len(data) > 0:
        year_month = data[0].get('year_month')
        if year_month:
            Budget.query.filter_by(user_id=current_user.id, year_month=year_month).delete()
            for b_data in data:
                budget = Budget(
                    category_id=b_data['category_id'],
                    year_month=b_data['year_month'],
                    amount=b_data['amount'],
                    user_id=current_user.id
                )
                db.session.add(budget)
            db.session.commit()
            return jsonify({'message': '예산이 저장되었습니다.'}), 200
    return jsonify({'error': '잘못된 데이터 형식입니다.'}), 400

# --- Memos ---
@app.route('/api/memos', methods=['GET'])
@login_required
def get_memos():
    memos = Memo.query.filter_by(user_id=current_user.id).all()
    return jsonify([m.to_dict() for m in memos]), 200

@app.route('/api/memos', methods=['POST'])
@login_required
def add_memo():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': '메모 내용이 없습니다.'}), 400
    memo = Memo(text=data['text'], date=data['date'], user_id=current_user.id)
    db.session.add(memo)
    db.session.commit()
    return jsonify(memo.to_dict()), 201

@app.route('/api/memos/<int:memo_id>', methods=['DELETE'])
@login_required
def delete_memo(memo_id):
    memo = Memo.query.get_or_404(memo_id)
    if memo.user_id != current_user.id:
        return jsonify({'error': '권한이 없습니다.'}), 403
    db.session.delete(memo)
    db.session.commit()
    return jsonify({'message': '메모가 삭제되었습니다.'}), 200


# --- Savings ---
@app.route('/api/savings', methods=['GET'])
@login_required
def get_savings():
    savings = Saving.query.filter_by(user_id=current_user.id).order_by(Saving.last_updated.desc()).all()
    return jsonify([s.to_dict() for s in savings]), 200

@app.route('/api/savings', methods=['POST'])
@login_required
def add_saving():
    data = request.get_json()
    if not data or not 'name' in data or 'amount' not in data:
        return jsonify({'error': '적금 이름과 금액은 필수입니다.'}), 400

    saving = Saving(
        name=data['name'],
        amount=data['amount'],
        goal=data.get('goal'),
        user_id=current_user.id
    )
    db.session.add(saving)
    db.session.commit()
    return jsonify(saving.to_dict()), 201

@app.route('/api/savings/<int:saving_id>', methods=['PUT'])
@login_required
def update_saving(saving_id):
    saving = Saving.query.get_or_404(saving_id)
    if saving.user_id != current_user.id:
        return jsonify({'error': '권한이 없습니다.'}), 403
        
    data = request.get_json()
    saving.name = data.get('name', saving.name)
    saving.amount = data.get('amount', saving.amount)
    saving.goal = data.get('goal', saving.goal)
    db.session.commit()
    return jsonify(saving.to_dict()), 200

@app.route('/api/savings/<int:saving_id>', methods=['DELETE'])
@login_required
def delete_saving(saving_id):
    saving = Saving.query.get_or_404(saving_id)
    if saving.user_id != current_user.id:
        return jsonify({'error': '권한이 없습니다.'}), 403
    
    db.session.delete(saving)
    db.session.commit()
    return jsonify({'message': '적금이 삭제되었습니다.'}), 200


if __name__ == '__main__':
    app.run(debug=True, port=5001)