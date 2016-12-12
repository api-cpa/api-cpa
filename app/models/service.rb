class Service < ApplicationRecord
  # User rights
  resourcify
  after_create :assign_default_user_role

  belongs_to :user

  validates :name, presence: true, length: {minimum: 2, maximum: 255}
  validates :description, presence: true

  validates :client_id,     uniqueness: true,
                            format: { with: /\A[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}\z/i },
                            presence: true,
                            if: :confirmed_at?
  validates :client_secret, format: { with: /\A[a-z0-9]{64}\z/i },
                            presence: true,
                            if: :confirmed_at?

  scope :authorized, ->(user) { user.has_role?(:superadmin) ? all : with_role(:developer, user) }

  def authorized?(user)
    user.has_role?(:superadmin) || user.has_role?(:developer, self)
  end

  def generate_client_id!
    begin
      self.client_id = SecureRandom.uuid
    end while self.class.exists?(client_id: client_id)
  end

  def generate_client_secret!
    self.client_secret = SecureRandom.hex(32)
  end

  def is_activated?
    !self.confirmed_at.nil?
  end

  def assign_default_user_role
    self.user.add_role(:developer, self)
  end
end