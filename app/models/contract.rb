class Contract < ApplicationRecord

  CONTRACT_STATUSES = {
    deletion: {
      index: 0,
      can: {
        show: {
          client: ['admin']
        },
        validate: {
          client: ['admin']
        },
        general_condition:{
          client: ['admin']
        }
      },
      conditions: {
        validate: Proc.new {|c| true}
      },
      notifications: {},
      allowed_parameters: [],
      next: :creation,
      prev: nil
    },
    creation: {
      index: 1,
      can: {
        show: {
          client: ['commercial']
        },
        edit: {
          client: ['commercial']
        },
        update: {
          client: ['commercial']
        },
        validate: {
          client: ['commercial']
        },
        validate_general_condition: {
          client: ['commercial']
        },
        cancel: {
          client: ['commercial']
        },
        comments: {
          startup: ['commercial']
        },
        general_condition: {
          client: ['commercial']
        }
      },
      conditions: {
        validate_general_condition: Proc.new {|c| ( c.general_condition_validated_client_user_id.nil? ) ? true : false},
        validate: [
            Proc.new {|c| ( !c.general_condition_validated_client_user_id.nil? ) ? true : [false, I18n.t('errors.messages.general_condition_not_validated')]}
        ]
      },
      notifications: {
        startup: ['admin', 'commercial']
      },
      allowed_parameters: [:code, :name, :contract_duration_type, :expected_start_date, :expected_end_date, :is_evergreen, :proxy_id, :client_id],
      next: :commercial_validation_sp,
      prev: nil
    },
    commercial_validation_sp: {
      index: 4,
      can: {
        show: {
          client: ['commercial'],
          startup: ['commercial']
        },
        edit: {
          client: ['commercial']
        },
        update: {
          client: ['commercial']
        },
        validate: {
          startup: ['commercial']
        },
        reject: {
          startup: ['commercial']
        },
        select_price: {
          startup: ['commercial']
        },
        prices: {
          startup: ['commercial']
        },
        comments: {
          client: ['commercial'],
          startup: ['commercial']
        },
        general_condition: {
          client: ['commercial'],
          startup: ['commercial']
        }
      },
      show_error: {
        validate: I18n.t('types.contract_statuses.commercial_validation_sp.error')
      },
      conditions: {
        validate: Proc.new {|c| (!c.price.nil? && c.price.persisted?) ? true : [false, I18n.t('errors.messages.missing_contract_prices')]}
      },
      notifications: {
        client: ['admin', 'commercial']
      },
      allowed_parameters: [:contract_duration_type, :expected_start_date, :expected_end_date, :is_evergreen, :proxy_id],
      next: :commercial_validation_client,
      prev: :creation
    },
    commercial_validation_client: {
      index: 7,
      can: {
        show: {
          client: ['commercial', 'accountant'],
          startup: ['commercial', 'accountant']
        },
        validate: {
          client: ['commercial']
        },
        reject_general_condition: {
          client: ['commercial']
        },
        validate_general_condition: {
          client: ['commercial']
        },
        reject: {
          client: ['commercial']
        },
        comments: {
          client: ['commercial', 'accountant'],
          startup: ['commercial', 'accountant']
        },
        general_condition: {
          client: ['commercial', 'accountant'],
          startup: ['commercial', 'accountant']
        }
      },
      show_error: {
        validate: I18n.t('types.contract_statuses.commercial_validation_client.error')
      },
      conditions: {
        validate_general_condition: Proc.new {|c| ( c.general_condition_validated_client_user_id.nil? ) ? true : false},
        validate: Proc.new {|c| ( !c.general_condition_validated_client_user_id.nil? ) ? true : [false, I18n.t('errors.messages.general_condition_not_validated')]}
      },
      notifications: {
        startup: ['admin', 'commercial']
      },
      allowed_parameters: [],
      next: :validation,
      prev: :commercial_validation_sp
    },
    validation: {
      index: 16,
      can: {
        show: {
          client: ['commercial', 'accountant'],
          startup: ['commercial', 'accountant']
        },
        validate: {
          startup: ['commercial']
        },
        comments: {
          client: ['commercial'],
          startup: ['commercial']
        },
        reject: {
          startup: ['commercial']
        },
        general_condition: {
          client: ['commercial', 'accountant'],
          startup: ['commercial', 'accountant']
        }
      },
      show_error: {
        validate: I18n.t('types.contract_statuses.validation.error')
      },
      conditions: {
        validate: Proc.new {|c| true}
      },
      notifications: {
        client: ['admin', 'commercial'],
        startup: ['admin', 'commercial']
      },
      allowed_parameters: [],
      next: :validation_production,
      prev: :commercial_validation_client
    },
    validation_production: {
      index: 20,
      can: {
        show: {
          client: ['commercial', 'accountant'],
          startup: ['commercial', 'accountant']
        },
        comments: {
          client: ['commercial'],
          startup: ['commercial']
        },
        general_condition: {
          client: ['commercial', 'accountant'],
          startup: ['commercial', 'accountant']
        }
      },
      show_error: {},
      conditions: {
        validate: Proc.new {|c| false}
      },
      notifications: {
        client: ['admin', 'commercial'],
        startup: ['admin', 'commercial']
      },
      allowed_parameters: [],
      next: nil,
      prev: :commercial_validation_client
    }
  }
  CONTRACT_STATUSES_ENUM = CONTRACT_STATUSES.each_with_object({}) do |k, h| h[k[0]] = k[1][:index] end
  enum status: CONTRACT_STATUSES_ENUM

  CONTRACT_DURATION_TYPES = {
    custom:  { index: 0 },
    monthly: { index: 1 },
    yearly:  { index: 2 }
  }
  CONTRACT_DURATION_TYPES_ENUM = CONTRACT_DURATION_TYPES.each_with_object({}) do |k, h| h[k[0]] = k[1][:index] end
  enum contract_duration_type: CONTRACT_DURATION_TYPES_ENUM

  # Versioning
  has_paper_trail

  belongs_to :proxy
  belongs_to :user
  belongs_to :company
  belongs_to :client, class_name: Service.name
  belongs_to :startup, class_name: Service.name
  belongs_to :general_condition_validated_client_user, class_name: User.name
  belongs_to :general_condition, class_name: GeneralCondition.name

  has_one :price
  has_many :comments, as: :commentable
  has_many :measure_tokens

  accepts_nested_attributes_for :price

  # TODO remove association, and make it via ":through"
  before_validation :set_startup_id

  before_validation :set_expected_end_date_and_expected_contract_duration

  validates :name, presence: true
  validates :startup_id, presence:true
  validates :client_id, presence:true
  validates :proxy_id, presence:true, uniqueness: {scope: [:client_id, :startup_id]}
  validates :expected_contract_duration, presence: true, numericality: {greater_than: 0, less_than_or_equal: 12}
  validates :expected_start_date, presence: true, date: true
  validates :expected_end_date, presence: true, date: {after: Proc.new {|record| record.expected_start_date}}


  scope :associated_companies, ->(company) { where(company: company) }
  scope :associated_clients, ->(client) { where(client: client) }
  scope :associated_startups, ->(startup) { where(startup: startup) }
  scope :associated_service, ->(service) { where("(startup_id IN (:service_ids) AND status != #{CONTRACT_STATUSES[:deletion][:index]} AND status != #{CONTRACT_STATUSES[:creation][:index]}) OR client_id IN (:service_ids)", service_ids: service.subtree_ids) }
  scope :associated_user, ->(user) { where("(startup_id IN (:service_ids) AND status != #{CONTRACT_STATUSES[:deletion][:index]} AND status != #{CONTRACT_STATUSES[:creation][:index]}) OR client_id IN (:service_ids)", service_ids: user.services.map {|s| s.subtree_ids}.flatten.uniq) }

  scope :owned, ->(user) { where(user: user) }

  def set_dup_price(price_id)
    unless price_id.empty?
      price_temp = Price.find(price_id)
      price = price_temp.dup_attached(self.price)
      price_params = PriceParameter.where(price_id: price_id)
      dup_price_param(price_params, price)
      self.price = price
    end
  end

  def dup_price_param(price_params, price)
    price_params.each do |price_param|
      price_param.dup_attached(price)
    end
  end

  def status_config
    Contract::CONTRACT_STATUSES[self.status.to_sym]
  end

  def is_developer?(user, scope)
    return true if user.is_developer_of?(self.send(scope))
    return self.is_admin?(user, scope)
  end

  def is_accountant?(user, scope)
    return true if user.is_accountant_of?(self.send(scope))
    return self.is_admin?(user, scope)
  end

  def is_commercial?(user, scope)
    return true if user.is_commercial_of?(self.send(scope))
    return self.is_admin?(user, scope)
  end

  def is_admin?(user, scope)
    return true if user.has_role?(:superadmin)
    return true if user.is_admin_of?(self.send(scope))
    false
  end

  def exec_condition(action_condition)
    unless action_condition.kind_of?(Array)
      status, error = action_condition.call(self)
      return [false, [error]] unless status
    else
      g_status = true
      errors = []
      action_condition.each do |cond|
        status, error = cond.call(self)
        errors << error unless status
        g_status = false unless status
      end
      return [false, errors] unless g_status
    end
    return true
  end

  def can?(user, action)
    return false if status_config[:can].nil? || status_config[:can][action].nil?
    unless status_config[:conditions].nil? || status_config[:conditions][action].nil?
      status, errors = exec_condition(status_config[:conditions][action])
      return [false, errors] unless status
    end
    status_config[:can][action].each_pair do |scope, roles|
      roles.each do |role|
        return true if self.send("is_#{role}?", user, scope)
      end
    end
    return [false, [status_config[:show_error][action]]] if status_config[:show_error]
    false
  end

  def to_s
    name
  end

  def set_startup_id
    self.startup_id = self.proxy.service.id if self.proxy
  end

  def set_expected_end_date_and_expected_contract_duration
    case self.contract_duration_type.to_sym
      when :monthly
        if self.expected_start_date
          self.expected_end_date = self.expected_start_date + 1.month
          self.expected_contract_duration = (self.expected_end_date - self.expected_start_date).to_i
        end
      when :yearly
        if self.expected_start_date
          self.expected_end_date = self.expected_start_date + 1.year
          self.expected_contract_duration = (self.expected_end_date - self.expected_start_date).to_i
        end
      else
        self.expected_contract_duration = (self.expected_end_date - self.expected_start_date).to_i if self.expected_start_date && self.expected_end_date
    end
  end
end
