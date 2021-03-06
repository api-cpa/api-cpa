module Tester
  class Result < ApplicationRecord

    belongs_to :route
    belongs_to :proxy
    belongs_to :service

    belongs_to :tester_request,
               inverse_of: :tester_results,
               class_name: Tester::Request.name

    validates :route, presence: true
    validates :proxy, presence: true
    validates :service, presence: true
    validates :tester_request_id, uniqueness: {scope: [:route_id, :proxy_id, :service_id]}

    scope :by_route, -> (route) {where(route: route)}
    scope :successful, -> {where(status: true)}
    scope :failed, -> {where(status: false)}

    scope :expired, -> {
      joins(:tester_request)
        .where('tester_requests_templates.updated_at >= tester_results.created_at')
    }

    scope :not_expired, -> {
      joins(:tester_request)
        .where('tester_requests_templates.updated_at < tester_results.created_at')
    }

  end
end