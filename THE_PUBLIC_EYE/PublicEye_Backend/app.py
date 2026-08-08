from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

# DATABASE CONFIG
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///publiceye.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# =========================
# DATABASE MODEL
# =========================
class Complaint(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.String(20), unique=True)
    category = db.Column(db.String(100))
    address = db.Column(db.String(200))
    description = db.Column(db.Text)

    username = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    anonymous = db.Column(db.Boolean, default=False)

    status = db.Column(db.String(50), default="Pending")


# =========================
# GENERATE UNIQUE ID
# =========================
def generate_complaint_id():
    while True:
        cid = "PE-" + str(random.randint(1000, 9999))
        exists = Complaint.query.filter_by(complaint_id=cid).first()
        if not exists:
            return cid


# =========================
# HOME
# =========================
@app.route('/')
def home():
    return "PublicEye Backend Running 🚀"


# =========================
# SAVE COMPLAINT
# =========================
@app.route('/save_complaint', methods=['POST'])
def save_complaint():
    try:
        category = request.form.get('category')
        address = request.form.get('title')   # address field
        description = request.form.get('description')

        username = request.form.get('username')
        phone = request.form.get('phone')
        anonymous = request.form.get('anonymous') == 'on'

        complaint_id = generate_complaint_id()

        new_complaint = Complaint(
            complaint_id=complaint_id,
            category=category,
            address=address,
            description=description,
            username=username,
            phone=phone,
            anonymous=anonymous
        )

        db.session.add(new_complaint)
        db.session.commit()

        return jsonify({
            "status": "success",
            "complaint_id": complaint_id
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "server error"})


# =========================
# TRACK COMPLAINT
# =========================
@app.route('/track', methods=['POST'])
def track():
    complaint_id = request.form.get('complaint_id')

    complaint = Complaint.query.filter_by(complaint_id=complaint_id).first()

    if complaint:
        # 🔥 anonymity logic
        if complaint.anonymous:
            name = "Anonymous"
        else:
            name = complaint.username

        return jsonify({
            "complaint_id": complaint.complaint_id,
            "category": complaint.category,
            "address": complaint.address,
            "description": complaint.description,
            "status": complaint.status,
            "username": name
        })

    else:
        return jsonify({"error": "Complaint not found"})


# =========================
# ADMIN - ACTIVE COMPLAINTS
# =========================
@app.route('/admin/complaints')
def get_complaints():
    complaints = Complaint.query.filter(Complaint.status != "Resolved").all()

    data = []
    for c in complaints:
        data.append({
            "complaint_id": c.complaint_id,
            "category": c.category,
            "address": c.address,
            "status": c.status,
            "username": c.username,
            "phone": c.phone
        })

    return jsonify(data)


# =========================
# ADMIN - RESOLVED
# =========================
@app.route('/admin/resolved')
def get_resolved():
    complaints = Complaint.query.filter_by(status="Resolved").all()

    data = []
    for c in complaints:
        data.append({
            "complaint_id": c.complaint_id,
            "category": c.category,
            "address": c.address,
            "status": c.status,
            "username": c.username,
            "phone": c.phone
        })

    return jsonify(data)


# =========================
# ADMIN - UPDATE STATUS
# =========================
@app.route('/admin/update', methods=['POST'])
def update_status():
    complaint_id = request.form.get('complaint_id')
    status = request.form.get('status')

    complaint = Complaint.query.filter_by(complaint_id=complaint_id).first()

    if complaint:
        complaint.status = status
        db.session.commit()
        return jsonify({"success": True})

    return jsonify({"error": True})


# =========================
# PUBLIC FEED
# =========================
@app.route('/feed')
def feed():
    complaints = Complaint.query.all()

    data = []
    for c in complaints:

        # 🔥 anonymity applied here
        if c.anonymous:
            name = "Anonymous"
        else:
            name = c.username

        data.append({
            "complaint_id": c.complaint_id,
            "category": c.category,
            "address": c.address,
            "status": c.status,
            "username": name
        })

    return jsonify(data)


# =========================
# RUN SERVER
# =========================
if __name__ == '__main__':
    with app.app_context():
        db.create_all()

    app.run(debug=True)