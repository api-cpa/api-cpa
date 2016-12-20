class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  helper_method :current_service
  helper_method :current_functionality

  def current_service
    nil
  end

  def current_functionality
    nil
  end
end
