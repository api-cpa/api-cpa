class Measurement < ApplicationRecord

  belongs_to  :client, class_name: :Service
  belongs_to  :service
  belongs_to  :proxy
  belongs_to  :route

  scope :by_client, ->(client) { where(client_id: client.id) }
  scope :by_service, ->(service) { where(service_id: service.id) }
  scope :by_proxy, ->(proxy) { where(proxy_id: proxy.id) }
  scope :by_route, ->(route) { where(route_id: route.id) }

  def increment_call
    self.requests_count += 1
  end

  class << self # Class methods
    def get_identical(client, service, proxy, route, date_start, date_end)
      measure = Measurement.where(client_id: client.id, service_id: service.id,
              proxy_id: proxy.id, route_id: route.id, created_at: date_start..date_end )
      if !measure.nil? && measure.count >= 1
        return measure.first
      end
      return nil
    end
  end

end
