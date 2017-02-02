class Company < ApplicationRecord

  has_many :services
  belongs_to :user
  has_one :contact_detail, as: :contactable, dependent: :destroy

  accepts_nested_attributes_for :contact_detail, allow_destroy: true

  validates :name, uniqueness: true, presence: true, length: {minimum: 2, maximum: 255}
  validates :contact_detail, presence: true

end
