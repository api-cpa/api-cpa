class Service < ApplicationRecord
  # Versioning
  has_paper_trail

  # User rights
  resourcify
  after_create :assign_default_user_role

  # Service rights
  rolify strict: true, role_join_table_name: 'public.services_roles'

  SERVICE_TYPES = {startup: {index: 1}, client: {index: 2}}
  SERVICE_TYPES_ENUM = SERVICE_TYPES.each_with_object({}) do |k, h| h[k[0]] = k[1][:index] end
  enum service_type: SERVICE_TYPES_ENUM

  belongs_to :user
  belongs_to :company
  has_many :proxies
  has_many :routes, through: :proxies
  has_one :contact_detail, as: :contactable, dependent: :destroy
  has_many :refresh_tokens

  accepts_nested_attributes_for :contact_detail, allow_destroy: true

  validates :name, uniqueness: true, presence: true, length: {minimum: 2, maximum: 255}
  validates :description, presence: true

  validates :service_type, presence: true
  before_save :public_validation

  validates :website, url: true, allow_blank: true

  validates :subdomain, presence: true, if: :is_activated?
  validates :subdomain, uniqueness: true, format: {with: /\A[\-a-z0-9]*\z/}, length: {minimum: 2, maximum: 35}, if: Proc.new { !subdomain.nil? }
  validate :subdomain_changed_disallowed

  validates :client_id,     uniqueness: true,
                            format: { with: /\A[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}\z/i },
                            presence: true,
                            if: :confirmed_at?
  validates :client_secret, format: { with: /\A[a-z0-9]{64}\z/i },
                            presence: true,
                            if: :confirmed_at?

  scope :authorized, ->(user) { user.has_role?(:superadmin) ? all : find_as(:developer, user) }
  scope :owned, ->(user) { where(user: user) }
  scope :activated, -> { where.not(confirmed_at: nil) }
  scope :associated, ->(company) { where(company: company) }

  scope :published, -> { where('confirmed_at IS NOT NULL AND public = true') }

  def authorized?(user)
    user.is_superadmin? || (self.company && user.is_admin_of?(self.company)) || user.has_role?(:developer, self)
  end

  def associated?(user)
    user.has_role?(:admin, self.company)
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

  def is_activable?
    !self.subdomain.blank?
  end

  def is_client?
    self.service_type.to_s == 'client'
  end

  def subdomain_changed_disallowed
    if self.persisted? && subdomain_changed? && self.is_activated?
      errors.add(:subdomain, I18n.t('activerecord.validations.service.subdomain_changed_disallowed'))
    end
  end

  def assign_default_user_role
    self.user.add_role(:developer, self)
  end

  def activate
    if self.is_activable?
      self.confirmed_at = Date.new if self.confirmed_at.nil?
      self.generate_client_id! unless self.client_id.present?
      self.generate_client_secret! unless self.client_secret.present?
      self.save
    end
  end

  def deactivate
    self.confirmed_at = nil
    self.save
  end

  def public_validation
    if self.is_client?
      self.public = false
    end
  end

  def to_s
    name
  end
end
