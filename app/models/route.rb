class Route < ApplicationRecord
  # Versioning
  has_paper_trail

  resourcify
  after_create :assign_default_user_role

  PROTOCOLS = {https: 1, http: 2}
  PROTOCOLS_TEST = {https: 1, http: 2}
  enum protocol: PROTOCOLS, _prefix: true
  enum protocol_test: PROTOCOLS_TEST, _prefix: true

  ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  ALLOWED_FORMATS = [
    'application/json',
    'application/x-www-form-urlencoded',
  ]

  belongs_to :user
  belongs_to :proxy, touch: true
  has_one :service, through: :proxy
  has_many :query_parameters, dependent: :destroy
  has_many :error_measurements, dependent: :destroy
  has_many :contracts, through: :proxy
  has_many :prices, dependent: :nullify
  has_many :tester_requests, dependent: :destroy, class_name: Tester::Request.name
  has_many :tester_results, dependent: :destroy, class_name: Tester::Result.name

  validates :hostname, hostname: true, if: Proc.new { hostname.present? }
  validates :hostname_test, hostname: true, if: Proc.new { hostname_test.present? }
  validates :subdomain, uniqueness: {scope: :proxy_id, case_sensitive: false}, presence: true, subdomain: true, length: {minimum: 2, maximum: 35}

  validates :name, uniqueness: {scope: :proxy_id, case_sensitive: false}, presence: true, length: {minimum: 2, maximum: 255}
  validates :description, presence: true
  validates :url, presence: true
  validates :url, format: {with: /\A\//}
  validates :url, format: {without: /\?/, message: I18n.t('errors.messages.parameters_not_allowed')}
  validate :validate_methods

  def validate_methods
    if !allowed_methods.is_a?(Array)
      errors.add(:allowed_methods, :invalid)
      return
    end

    # rails adds an empty value to allow to uncheck all values
    # we need to delete this value before validating the array
    allowed_methods.delete ''

    if !allowed_methods.any? || allowed_methods.detect {|m| !ALLOWED_METHODS.include?(m)}
      errors.add(:allowed_methods, :invalid)
    end
  end

  def authorized?(user)
    user.has_role?(:superadmin) || user.has_role?(:developer, self.proxy)
  end

  def assign_default_user_role
    self.user.add_role(:developer, self)
  end

  def uri
    "#{self.protocol || self.proxy.proxy_parameter.protocol}://#{self.hostname.present? ? self.hostname : self.proxy.proxy_parameter.hostname}:#{self.port.present? ? self.port : self.proxy.proxy_parameter.port}#{self.url}"
  end

  def uri_test
    "#{self.protocol_test || self.proxy.proxy_parameter_test.protocol}://#{self.hostname_test.present? ? self.hostname_test : self.proxy.proxy_parameter_test.hostname}:#{self.port_test.present? ? self.port_test : self.proxy.proxy_parameter_test.port}#{self.url}"
  end

  def local_url(version = 'v1')
    "#{self.proxy.local_url(version)}/routes/#{self.subdomain}/request"
  end

  def to_s
    name
  end

  def failed_or_missing_tester_results(tester_request = nil)
    scope = tester_request.nil? ? [:all] : [:where, 'tester_requests.id = ?', tester_request.id]
    Tester::Requests::Template
      .send(*scope)
      .applicable_on_route(self)
      .with_failed_or_missing_results([self])
  end
end
